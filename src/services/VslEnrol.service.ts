import { UniqueConstraintError } from 'sequelize';

import logger from '../configs/logger.config';
import { vslConfig } from '../configs/server.config';
import { VSL_PLAN } from '../constants/vslPlan';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import sequelize from '../db/models/sequelize';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import VslRunRepository from '../repositories/VslRun.repository';
import VslStepRepository from '../repositories/VslStep.repository';
import { VslRunStatus } from '../utils/enums/VslRunStatus';
import { VslStepStatus } from '../utils/enums/VslStepStatus';

class VslEnrolService {
    // Initializes the service with the repositories required for VSL enrollment.
    constructor(
        private readonly candidateSubmissionRepository: CandidateSubmissionRepository,
        private readonly vslRunRepository: VslRunRepository,
        private readonly vslStepRepository: VslStepRepository,
    ) {}

    // Finds eligible submissions and either logs or creates their VSL runs.
    async runEnrollmentSweep(now: Date = new Date()): Promise<void> {
        if (!vslConfig.ENABLED) {
            logger.info('VSL enrollment is disabled.');
            return;
        }

        const minAge = vslConfig.ENROLL_MIN_AGE_MINUTES;
        const maxAge = vslConfig.ENROLL_MAX_AGE_MINUTES;

        if (
            !Number.isFinite(minAge) ||
            !Number.isFinite(maxAge) ||
            minAge < 0 ||
            maxAge < minAge
        ) {
            throw new Error('Invalid VSL enrollment age configuration.');
        }

        if (
            !Number.isFinite(vslConfig.STEP_UNIT_MINUTES) ||
            vslConfig.STEP_UNIT_MINUTES <= 0
        ) {
            throw new Error(
                'VSL_STEP_UNIT_MINUTES must be a positive number.',
            );
        }

        const createdAfter = new Date(
            now.getTime() - maxAge * 60_000,
        );

        const createdBefore = new Date(
            now.getTime() - minAge * 60_000,
        );

        const submissions =
            await this.candidateSubmissionRepository.findVslEnrollmentCandidates({
                createdAfter,
                createdBefore,
                formSlugs: vslConfig.ELIGIBLE_FORM_SLUGS,
                limit: vslConfig.BATCH_SIZE,
            });

        if (submissions.length === 0) {
            logger.info(
                'VSL enrollment sweep: no eligible submissions found.',
            );
            return;
        }

        const emailAllowlist = new Set(
            vslConfig.TEST_EMAIL_ALLOWLIST.map((email) =>
                email.trim().toLowerCase(),
            ),
        );

        let enrolledCount = 0;
        let dryRunCount = 0;
        let skippedCount = 0;

        for (const submission of submissions) {
            const candidate = submission.candidate;

            if (!candidate?.email) {
                skippedCount++;
                continue;
            }

            const candidateEmail = candidate.email.trim().toLowerCase();

            if (
                emailAllowlist.size > 0 &&
                !emailAllowlist.has(candidateEmail)
            ) {
                skippedCount++;
                continue;
            }

            if (vslConfig.DRY_RUN) {
                logger.info(
                    `VSL DRY RUN: would enrol submission ID ${submission.id}.`,
                );

                dryRunCount++;
                continue;
            }

            try {
                const enrolled = await this.createVslRun(submission);

                if (enrolled) {
                    enrolledCount++;
                } else {
                    skippedCount++;
                }
            } catch (error: unknown) {
                if (error instanceof UniqueConstraintError) {
                    logger.info(
                        `VSL enrollment skipped due to an existing run for submission ID ${submission.id}.`,
                    );

                    skippedCount++;
                    continue;
                }

                logger.error(
                    `VSL enrollment failed for submission ID ${submission.id}.`,
                );

                throw error;
            }
        }

        logger.info(
            `VSL enrollment sweep completed. Checked: ${submissions.length}, Enrolled: ${enrolledCount}, Would Enrol: ${dryRunCount}, Skipped: ${skippedCount}.`,
        );
    }

    // Creates a run and all its planned steps in one database transaction.
    private async createVslRun(
        submission: CandidateSubmission,
    ): Promise<boolean> {
        const candidate = submission.candidate;

        if (!candidate) {
            return false;
        }

        return await sequelize.transaction(async (transaction) => {
            const existingRun =
                await this.vslRunRepository.findBySubmissionId(
                    submission.id,
                    transaction,
                );

            if (existingRun) {
                return false;
            }

            const activeRun =
                await this.vslRunRepository.findActiveByCandidateId(
                    candidate.id,
                    transaction,
                );

            if (activeRun) {
                return false;
            }

            const [run, created] =
                await this.vslRunRepository.findOrCreateBySubmission(
                    {
                        candidateId: candidate.id,
                        submissionId: submission.id,
                        formSlug: submission.formSlug,
                        anchorAt: submission.createdAt,
                        status: VslRunStatus.ACTIVE,
                        stopReason: null,
                        holdUntil: null,
                        priorityFlag: false,
                        activeCandidateId: candidate.id,
                        completedAt: null,
                        stoppedAt: null,
                    },
                    transaction,
                );

            if (!created) {
                return false;
            }

            for (const planStep of VSL_PLAN) {
                const dueAt = new Date(
                    submission.createdAt.getTime() +
                        planStep.dayNumber *
                            vslConfig.STEP_UNIT_MINUTES *
                            60_000,
                );

                await this.vslStepRepository.createIfAbsent(
                    {
                        runId: run.id,
                        stepKey: planStep.key,
                        dayNumber: planStep.dayNumber,
                        channel: planStep.channel,
                        dueAt,
                        status: VslStepStatus.PENDING,
                        attemptCount: 0,
                        claimedAt: null,
                        processedAt: null,
                        lastError: null,
                    },
                    transaction,
                );
            }

            return true;
        });
    }
}

export default VslEnrolService;