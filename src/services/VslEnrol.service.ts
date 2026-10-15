import logger from '../configs/logger.config';
import { vslConfig } from '../configs/server.config';
import sequelize from '../db/models/sequelize';
import VslRunRepository from '../repositories/VslRun.repository';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import { VslRunStatus } from '../utils/enums/VslRunStatus';

class VslEnrolService {
    // Enrols eligible submissions into the VSL sequence.

    private readonly candidateSubmissionRepository = new CandidateSubmissionRepository();

    async enrolEligibleCandidates(): Promise<void> {
        if (!vslConfig.ENABLED || !vslConfig.FORM_SLUGS.length) return;

        const now = Date.now();
        const minCreatedAt = new Date(now - vslConfig.ENROLL_MAX_AGE_MINUTES * 60_000);
        const maxCreatedAt = new Date(now - vslConfig.ENROLL_MIN_AGE_MINUTES * 60_000);

        const submissions = await this.candidateSubmissionRepository.findVslEnrollmentCandidates(
            minCreatedAt,
            maxCreatedAt,
            vslConfig.FORM_SLUGS
        );

        const processedCandidates = new Set<number>();

        // Submissions are newest-first, so only the newest eligible one per candidate is considered.
        for (const submission of submissions) {
            const candidate = submission.candidate;

            if (!candidate || processedCandidates.has(candidate.id)) continue;
            processedCandidates.add(candidate.id);

            const email = candidate.email?.trim().toLowerCase();

            if (!email || candidate.optedOutAt) continue;

            // When configured, only allowlisted emails can be enrolled during testing.
            if (vslConfig.TEST_ALLOWLIST.length &&
                !vslConfig.TEST_ALLOWLIST.includes(email)) continue;

            if (await VslRunRepository.findBySubmission(submission.id)) continue;

            // Prevents a candidate from having multiple active runs.
            const activeRun = await VslRunRepository.findOne({
                activeCandidateId: candidate.id,
                status: VslRunStatus.ACTIVE
            });

            if (activeRun) continue;

            if (vslConfig.DRY_RUN) {
                logger.info('VSL dry run: eligible candidate', {
                    submissionId: submission.publicId,
                    candidateId: candidate.id
                });
                continue;
            }

            const transaction = await sequelize.transaction();

            try {
                await VslRunRepository.create({
                    candidateId: candidate.id,
                    submissionId: submission.id,
                    formSlug: submission.formSlug,
                    anchorAt: submission.createdAt,
                    stepsSent: 0,
                    status: VslRunStatus.ACTIVE,
                    stopReason: null,
                    activeCandidateId: candidate.id,
                    priorityFlag: false,
                    lastStepAt: null,
                    completedAt: null,
                    stoppedAt: null
                }, transaction);

                await transaction.commit();

                logger.info('VSL run enrolled', {
                    submissionId: submission.publicId,
                    candidateId: candidate.id
                });
            } catch (error) {
                try {
                    await transaction.rollback();
                } catch {
                    // Ignore rollback errors and preserve the original error.
                }

                // A concurrent worker may have created the run first.
                logger.error('VSL enrolment failed', {
                    submissionId: submission.publicId,
                    error
                });
            }
        }
    }
}

export default new VslEnrolService();