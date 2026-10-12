import { col, CreationAttributes, fn, InferAttributes, literal, Op, Sequelize, Transaction, WhereOptions } from 'sequelize';

import Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import QualificationForm from '../db/models/QualificationForm.model';
import { AdminSubmissionBaseFilters, AdminSubmissionPageFilters, AdminSubmissionStatusCountRow } from '../types/AdminSubmissionFilter.type';
import { CandidateSubmissionStatus } from '../utils/enums/CandidateSubmissionStatus';
import { activityAt, escapeLike } from '../utils/helpers/sql.helper';
import BaseRepository from './Base.repository';

class CandidateSubmissionRepository extends BaseRepository<CandidateSubmission> {
    constructor() {
        super(CandidateSubmission);
    }

    async create(data: CreationAttributes<CandidateSubmission>, transaction?: Transaction): Promise<CandidateSubmission> {
        return await this.model.create(data, { transaction });
    }

    async findById(id: string): Promise<CandidateSubmission | null> {
        const record = await this.model.findOne({
            where: {
                publicId: id
            },
            include: [
                {
                    association: 'candidate'
                }
            ]
        });

        return record;
    }


    async markSubmissionAsCompleted(id: string, data: Partial<InferAttributes<CandidateSubmission>>, transaction: Transaction): Promise<void> {
        await this.model.update(
            {
                status: data.status,
                submittedAt: data.submittedAt,
                leadScore: data.leadScore,
                leadTemperature: data.leadTemperature
            },
            {
                where: {
                    publicId: id
                },
                transaction
            },
        );
    }
    async markSubmissionAsBooked(id: string): Promise<void> {
        await this.model.update(
            {
                status: CandidateSubmissionStatus.BOOKED
            },
            {
                where: {
                    publicId: id
                }
            },
        );
    }

    async findAllBookingPendingSubmisssions(cutoffTime: Date): Promise<CandidateSubmission[]> {
        const submissions = await this.model.findAll({
            where: {
                submittedAt: {
                    [Op.lte]: cutoffTime
                },
                reminderCount: {
                    [Op.lt]: 3
                },
                status: CandidateSubmissionStatus.BOOKING_PENDING
            },
            include: [{
                model: Candidate, 
                as: 'candidate',
                attributes: ['fullName', 'email', 'phone'],
                required: true
            }]
        });

        return submissions;
    }

    async increaseReminderCount(submissionId: string, transaction: Transaction) {
        await this.model.increment('reminderCount', {
            where: {
                publicId: submissionId
            },
            by: 1,
            transaction
        });
    }

    async findVslEnrollmentCandidates(filters: {
        createdAfter: Date;
        createdBefore: Date;
        formSlugs: string[];
        limit: number;
    }): Promise<CandidateSubmission[]> {
        if (filters.formSlugs.length === 0) {
            return [];
        }

        if (!Number.isInteger(filters.limit) || filters.limit < 1) {
            throw new Error('limit must be a positive integer');
        }

        return await this.model.findAll({
            where: {
                status: CandidateSubmissionStatus.SUBMISSION_PENDING,

                createdAt: {
                    [Op.gte]: filters.createdAfter,
                    [Op.lte]: filters.createdBefore,
                },

                formSlug: {
                    [Op.in]: filters.formSlugs,
                },

                deletedAt: null,

                [Op.and]: [
                    literal(`
                        NOT EXISTS (
                            SELECT 1
                            FROM vsl_runs AS vr
                            WHERE
                                vr.submission_id = CandidateSubmission.id
                                OR (
                                    vr.candidate_id = CandidateSubmission.candidate_id
                                    AND vr.status = 'active'
                                )
                        )
                    `),
                ],
            },

            include: [
                {
                    model: Candidate,
                    as: 'candidate',
                    attributes: [
                        'id',
                        'fullName',
                        'email',
                        'emailUnsubscribedAt',
                        'optedOutAt',
                    ],
                    where: {
                        deletedAt: null,
                        emailUnsubscribedAt: null,
                        optedOutAt: null,
                    },
                    required: true,
                },
            ],

            order: [
                ['createdAt', 'ASC'],
                ['id', 'ASC'],
            ],

            limit: filters.limit,
        });
    } 

    private buildAdminBaseConditions(filters: AdminSubmissionBaseFilters): WhereOptions[] {
        const conditions: WhereOptions[] = [{ deletedAt: null }];

        if (filters.formSlug !== 'all') {
            conditions.push({ formSlug: filters.formSlug });
        }

        if (filters.source !== 'all') {
            conditions.push({ source: filters.source });
        }

        if (filters.rangeStart) {
            conditions.push(Sequelize.where(activityAt(), Op.gte, filters.rangeStart));
        }

        return conditions;
    }

    /**
     * One page of the admin submissions list, newest activity first, with the total number of matching rows.
     *
     * SQL it produces (simplified):
     *   SELECT s.public_id, s.form_slug, s.status, s.lead_score, ..., c.full_name, c.email, c.phone, f.name
     *   FROM candidate_submissions s
     *   JOIN candidates c           ON c.id = s.candidate_id AND c.deleted_at IS NULL
     *   JOIN qualification_forms f  ON f.id = s.form_id
     *   WHERE s.deleted_at IS NULL
     *     [AND s.form_slug = ?] [AND s.source = ?] [AND s.status = ?] [AND s.lead_temperature = ?]
     *     [AND COALESCE(s.submitted_at, s.created_at) >= ?]
     *     [AND (c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)]
     *   ORDER BY COALESCE(s.submitted_at, s.created_at) DESC, s.id DESC
     *   LIMIT ? OFFSET ?
     */
    async findAdminSubmissionPage(filters: AdminSubmissionPageFilters): Promise<{ rows: CandidateSubmission[], count: number }> {
        const conditions = this.buildAdminBaseConditions(filters);

        if (filters.status !== 'all') {
            conditions.push({ status: filters.status });
        }

        if (filters.temperature !== 'all') {
            conditions.push({ leadTemperature: filters.temperature });
        }

        if (filters.search.length >= 2) {
            const textPattern = `%${escapeLike(filters.search)}%`;
            const searchConditions: WhereOptions[] = [
                Sequelize.where(col('candidate.full_name'), Op.like, textPattern),
                Sequelize.where(col('candidate.email'), Op.like, textPattern),
            ];

            // Only a phone-looking search (digits, spaces, +, -, brackets) is matched against phone numbers. Otherwise an email
            // such as "name32@gmail.com" would also find every phone containing "32". Spaces/dashes in stored numbers are ignored.
            const looksLikePhone = /^[\d\s+\-()]+$/.test(filters.search);
            const digits = filters.search.replace(/\D/g, '');
            if (looksLikePhone && digits.length >= 3) {
                const cleanPhone = fn('REPLACE', fn('REPLACE', fn('REPLACE', col('candidate.phone'), ' ', ''), '-', ''), '+', '');
                searchConditions.push(Sequelize.where(cleanPhone, Op.like, `%${digits}%`));
            }

            conditions.push({ [Op.or]: searchConditions });
        }

        return await this.model.findAndCountAll({
            where: { [Op.and]: conditions },
            attributes: [
                'publicId',
                'formSlug',
                'status',
                'leadScore',
                'leadTemperature',
                'source',
                'utmCampaign',
                'reminderCount',
                'createdAt',
                'submittedAt',
            ],
            include: [
                {
                    model: Candidate,
                    as: 'candidate',
                    attributes: ['fullName', 'email', 'phone'],
                    where: { deletedAt: null },
                    required: true,
                },
                {
                    model: QualificationForm,
                    as: 'form',
                    attributes: ['name'],
                    required: true,
                },
            ],
            order: [
                [activityAt(), 'DESC'],
                ['id', 'DESC'],
            ],
            limit: filters.pageSize,
            offset: (filters.page - 1) * filters.pageSize,
            subQuery: false,
        });
    }

    /**
     * One submission by its public id, with the candidate and the form, for the admin detail page.
     * Same visibility rules as the list: a deleted submission or a deleted candidate is "not found".
     *
     *   SELECT s.*, c.full_name, c.email, c.phone, c.created_at, f.id, f.name
     *   FROM candidate_submissions s
     *   JOIN candidates c          ON c.id = s.candidate_id AND c.deleted_at IS NULL
     *   JOIN qualification_forms f ON f.id = s.form_id
     *   WHERE s.public_id = ? AND s.deleted_at IS NULL
     */
    async findAdminSubmissionDetail(publicId: string): Promise<CandidateSubmission | null> {
        return await this.model.findOne({
            where: { publicId, deletedAt: null },
            include: [
                {
                    model: Candidate,
                    as: 'candidate',
                    attributes: ['fullName', 'email', 'phone', 'createdAt'],
                    where: { deletedAt: null },
                    required: true,
                },
                {
                    model: QualificationForm,
                    as: 'form',
                    attributes: ['id', 'name'],
                    required: true,
                },
            ],
        });
    }

    /**
     * Several submissions by public id, with the candidate and form, for the internal lookup used by the booking service.
     *
     *   SELECT s.*, c.full_name, c.email, c.phone, f.name
     *   FROM candidate_submissions s
     *   JOIN candidates c ON c.id = s.candidate_id AND c.deleted_at IS NULL
     *   JOIN qualification_forms f ON f.id = s.form_id
     *   WHERE s.public_id IN (?) AND s.deleted_at IS NULL
     */
    async findAdminSubmissionsByPublicIds(publicIds: string[]): Promise<CandidateSubmission[]> {
        if (publicIds.length === 0) {
            return [];
        }

        return await this.model.findAll({
            where: { publicId: { [Op.in]: publicIds }, deletedAt: null },
            include: [
                {
                    model: Candidate,
                    as: 'candidate',
                    attributes: ['fullName', 'email', 'phone', 'createdAt'],
                    where: { deletedAt: null },
                    required: true,
                },
                {
                    model: QualificationForm,
                    as: 'form',
                    attributes: ['id', 'name'],
                    required: true,
                },
            ],
        });
    }

    /**
     * Counts for the status tabs and stat cards, over the base filters only (not status, temperature or search),
     * so the numbers do not move while the user types or switches tab.
     *
     *   SELECT s.status, COUNT(s.id) AS total, SUM(CASE WHEN s.lead_temperature = 'hot' THEN 1 ELSE 0 END) AS hot
     *   FROM candidate_submissions s
     *   JOIN candidates c ON c.id = s.candidate_id AND c.deleted_at IS NULL
     *   WHERE s.deleted_at IS NULL [AND form_slug / source / range conditions]
     *   GROUP BY s.status
     */
    async getAdminSubmissionStatusCounts(filters: AdminSubmissionBaseFilters): Promise<AdminSubmissionStatusCountRow[]> {
        const rows = await this.model.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('CandidateSubmission.id')), 'total'],
                [fn('SUM', literal('CASE WHEN `CandidateSubmission`.`lead_temperature` = \'hot\' THEN 1 ELSE 0 END')), 'hot'],
            ],
            // Same candidate join as the list (but no columns selected), so a deleted candidate is not counted here and listed nowhere
            include: [{ model: Candidate, as: 'candidate', attributes: [], where: { deletedAt: null }, required: true }],
            where: { [Op.and]: this.buildAdminBaseConditions(filters) },
            group: ['CandidateSubmission.status'],
            raw: true,
        });

        return rows as unknown as AdminSubmissionStatusCountRow[];
    }

    /**
     * Every distinct traffic source seen so far (for the Source dropdown), regardless of the other filters.
     *
     *   SELECT source FROM candidate_submissions WHERE deleted_at IS NULL AND source IS NOT NULL GROUP BY source ORDER BY source
     */
    async findDistinctSources(): Promise<string[]> {
        const rows = await this.model.findAll({
            attributes: ['source'],
            where: {
                [Op.and]: [{ deletedAt: null }, { source: { [Op.ne]: null } }],
            },
            group: ['source'],
            order: [['source', 'ASC']],
            raw: true,
        });

        return rows.map((row) => String(row.source));
    }
}

export default CandidateSubmissionRepository;