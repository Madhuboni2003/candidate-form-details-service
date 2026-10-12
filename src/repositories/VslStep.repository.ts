import { CreationAttributes, Op, Transaction } from 'sequelize';

import Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import VslRun from '../db/models/VslRun.model';
import VslStep from '../db/models/VslStep.model';
import sequelize from '../db/models/sequelize';
import { VslStepKey } from '../utils/enums/VslStepKey';
import { VslStepStatus } from '../utils/enums/VslStepStatus';
import BaseRepository from './Base.repository';

class VslStepRepository extends BaseRepository<VslStep> {
    // Initializes the repository with the VslStep model.
    constructor() {
        super(VslStep);
    }

    // Finds all steps belonging to a particular VSL run.
    async findByRunId(
        runId: number,
        transaction?: Transaction,
    ): Promise<VslStep[]> {
        return await this.model.findAll({
            where: { runId },
            order: [['dayNumber', 'ASC']],
            transaction,
        });
    }

    // Finds a specific step using its run ID and step key.
    async findByRunAndStepKey(
        runId: number,
        stepKey: VslStepKey,
        transaction?: Transaction,
    ): Promise<VslStep | null> {
        return await this.model.findOne({
            where: { runId, stepKey },
            transaction,
        });
    }

    // Creates a step only if the same step does not already exist for the run.
    async createIfAbsent(
        data: CreationAttributes<VslStep>,
        transaction?: Transaction,
    ): Promise<[VslStep, boolean]> {
        return await this.model.findOrCreate({
            where: {
                runId: data.runId,
                stepKey: data.stepKey,
            },
            defaults: data,
            transaction,
        });
    }

    // Claims due pending steps and loads the run, candidate, and submission details.
    async claimDuePendingSteps(
        limit = 100,
        now = new Date(),
    ): Promise<VslStep[]> {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new Error('limit must be a positive integer');
        }

        return await sequelize.transaction(async (transaction) => {
            const steps = await this.model.findAll({
                where: {
                    status: VslStepStatus.PENDING,
                    dueAt: {
                        [Op.lte]: now,
                    },
                },

                include: [
                    {
                        model: VslRun,
                        as: 'run',
                        required: true,
                        include: [
                            {
                                model: Candidate,
                                as: 'candidate',
                                required: true,
                                attributes: [
                                    'id',
                                    'fullName',
                                    'email',
                                    'phone',
                                    'emailUnsubscribedAt',
                                    'optedOutAt',
                                ],
                            },
                            {
                                model: CandidateSubmission,
                                as: 'submission',
                                required: true,
                                attributes: [
                                    'id',
                                    'publicId',
                                    'status',
                                    'formSlug',
                                    'createdAt',
                                ],
                            },
                        ],
                    },
                ],

                order: [
                    ['dueAt', 'ASC'],
                    ['id', 'ASC'],
                ],

                limit,
                transaction,
                lock: transaction.LOCK.UPDATE,
                skipLocked: true,
            });

            if (steps.length === 0) {
                return [];
            }

            const stepIds = steps.map((step) => step.id);

            await this.model.update(
                {
                    status: VslStepStatus.PROCESSING,
                    claimedAt: now,
                },
                {
                    where: {
                        id: {
                            [Op.in]: stepIds,
                        },
                        status: VslStepStatus.PENDING,
                    },
                    transaction,
                },
            );

            for (const step of steps) {
                step.status = VslStepStatus.PROCESSING;
                step.claimedAt = now;
            }

            return steps;
        });
    }
}

export default VslStepRepository;