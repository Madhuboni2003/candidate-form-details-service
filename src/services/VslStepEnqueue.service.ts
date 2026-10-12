import { Op } from 'sequelize';

import logger from '../configs/logger.config';
import { frontendConfig, vslConfig } from '../configs/server.config';
import Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import sequelize from '../db/models/sequelize';
import VslRun from '../db/models/VslRun.model';
import VslStep from '../db/models/VslStep.model';
import { VslNotificationEnqueue } from '../producers/vslNotification.producer';
import VslStepRepository from '../repositories/VslStep.repository';
import { CandidateSubmissionStatus } from '../utils/enums/CandidateSubmissionStatus';
import { NotificationChannel } from '../utils/enums/NotificationChannel';
import { VslRunStatus } from '../utils/enums/VslRunStatus';
import { VslStepChannel } from '../utils/enums/VslStepChannel';
import { VslStepKey } from '../utils/enums/VslStepKey';
import { VslStepStatus } from '../utils/enums/VslStepStatus';
import { VslStopReason } from '../utils/enums/VslStopReason';

// Maps each VSL email step to its Listmonk template key.
const VSL_EMAIL_TEMPLATE_KEYS: Partial<Record<VslStepKey, string>> = {
    [VslStepKey.VSL_D1_EMAIL]: 'EMAIL_IC_VSL_01_MOVE_ON',
    [VslStepKey.VSL_D3_EMAIL]: 'EMAIL_IC_VSL_02_ABHINAY_PROOF',
    [VslStepKey.VSL_D7_EMAIL]: 'EMAIL_IC_VSL_03_CLOSE_FOR_NOW',
};

// Defines the email subject for each VSL step.
const VSL_EMAIL_SUBJECTS: Partial<Record<VslStepKey, string>> = {
    [VslStepKey.VSL_D1_EMAIL]:'You checked this yesterday - one thing before you move on',
        
    [VslStepKey.VSL_D3_EMAIL]:'See Abhinay’s proof',
        
    [VslStepKey.VSL_D7_EMAIL]:  'Should we close this for now?',
       
};
class VslStepEnqueueService {
    // Initializes the service with the VSL step repository.
    constructor(
        private readonly vslStepRepository: VslStepRepository,
    ) {}

    // Finds due steps, rechecks candidate eligibility, and enqueues valid email notifications.
    async enqueueDueSteps(now: Date = new Date()): Promise<void> {
        if (!vslConfig.ENABLED) {
            logger.info('VSL is disabled. Skipping due-step processing.');
            return;
        }

        if (vslConfig.DRY_RUN) {
            logger.info(
                'VSL dry-run is enabled. No steps will be claimed or enqueued.',
            );
            return;
        }

        if (!this.isWithinSendWindow(now)) {
            logger.info('Outside the VSL send window. Skipping this sweep.');
            return;
        }

        const steps = await this.vslStepRepository.claimDuePendingSteps(
            vslConfig.BATCH_SIZE,
            now,
        );

        for (const step of steps) {
            try {
                await this.processStep(step.id, now);
            } catch (error: unknown) {
                // Returns the step to pending so a later sweep can retry it.
                await VslStep.update(
                    {
                        status: VslStepStatus.PENDING,
                        claimedAt: null,
                        lastError:
                            error instanceof Error
                                ? error.message
                                : 'Unknown enqueue error',
                    },
                    {
                        where: {
                            id: step.id,
                            status: VslStepStatus.PROCESSING,
                        },
                    },
                );

                logger.error('Failed to process VSL step', {
                    vslStepId: step.id,
                    error,
                });
            }
        }

        logger.info('VSL due-step sweep completed', {
            claimedCount: steps.length,
        });
    }

    // Rechecks the latest database state before enqueuing a notification.
    private async processStep(
        stepId: number,
        now: Date,
    ): Promise<void> {
        const step = await VslStep.findByPk(stepId);

        if (!step || step.status !== VslStepStatus.PROCESSING) {
            return;
        }

        const run = await VslRun.findByPk(step.runId);

        if (!run || run.status !== VslRunStatus.ACTIVE) {
            await this.cancelStep(step.id, now);
            return;
        }

        const [candidate, submission] = await Promise.all([
            Candidate.findByPk(run.candidateId),
            CandidateSubmission.findByPk(run.submissionId),
        ]);

        if (!candidate || !submission) {
            await this.stopRun(run.id, VslStopReason.OTHER, now);
            return;
        }

        if (candidate.optedOutAt) {
            await this.stopRun(run.id, VslStopReason.OPTED_OUT, now);
            return;
        }

        if (candidate.emailUnsubscribedAt) {
            await this.stopRun(run.id, VslStopReason.UNSUBSCRIBED, now);
            return;
        }

        const stopReason = this.getSubmissionStopReason(
            submission.status,
        );

        if (stopReason) {
            await this.stopRun(run.id, stopReason, now);
            return;
        }

        // Internal steps need task-handling logic, not the email queue.
        if (step.channel !== VslStepChannel.EMAIL) {
            await this.markStepFailed(
                step.id,
                'Internal VSL task handling is not implemented yet.',
                now,
            );
            return;
        }

        if (!candidate.email?.trim()) {
            await this.stopRun(run.id, VslStopReason.OTHER, now);
            return;
        }

        const templateKey = VSL_EMAIL_TEMPLATE_KEYS[step.stepKey];
        const subject = VSL_EMAIL_SUBJECTS[step.stepKey];

        if (!templateKey || !subject) {
            await this.markStepFailed(
                step.id,
                `No email template configured for ${step.stepKey}.`,
                now,
            );
            return;
        }

        const baseUrl = frontendConfig.CANDIDATE_FRONTEND_URL.replace(
            /\/+$/,
            '',
        );

        await VslNotificationEnqueue({
            candidateId: candidate.id,
            submissionId: submission.publicId,
            vslRunId: run.id,
            vslStepId: step.id,
            stepKey: step.stepKey,
            candidateName: candidate.fullName,
            candidateEmail: candidate.email.trim(),
            formLink: `${baseUrl}/${submission.formSlug}`,
            subject,
            channels: [NotificationChannel.EMAIL],
            templateKeys: {
                [NotificationChannel.EMAIL]: templateKey,
            },
        });

        // Keep the step in PROCESSING until delivery is confirmed.
        logger.info('VSL notification enqueued', {
            vslRunId: run.id,
            vslStepId: step.id,
            stepKey: step.stepKey,
        });
    }

    // Determines whether a candidate's submission status should stop the VSL run.
    private getSubmissionStopReason(
        status: CandidateSubmissionStatus,
    ): VslStopReason | null {
        switch (status) {
            case CandidateSubmissionStatus.SUBMISSION_PENDING:
                return null;

            case CandidateSubmissionStatus.BOOKING_PENDING:
                return VslStopReason.FORM_SUBMITTED;

            case CandidateSubmissionStatus.BOOKED:
                return VslStopReason.BOOKED;

            case CandidateSubmissionStatus.CONVERTED:
                return VslStopReason.CONVERTED;

            case CandidateSubmissionStatus.CANCELLED:
                return VslStopReason.SUBMISSION_CANCELLED;

            default:
                return VslStopReason.LATER_STAGE;
        }
    }

    // Stops a run and cancels all its pending or processing steps atomically.
    private async stopRun(
        runId: number,
        reason: VslStopReason,
        now: Date,
    ): Promise<void> {
        await sequelize.transaction(async (transaction) => {
            const run = await VslRun.findByPk(runId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (run && run.status === VslRunStatus.ACTIVE) {
                run.status = VslRunStatus.STOPPED;
                run.stopReason = reason;
                run.stoppedAt = now;
                run.activeCandidateId = null;

                await run.save({ transaction });
            }

            await VslStep.update(
                {
                    status: VslStepStatus.CANCELLED,
                    processedAt: now,
                    lastError: `VSL run stopped: ${reason}`,
                },
                {
                    where: {
                        runId,
                        status: {
                            [Op.in]: [
                                VslStepStatus.PENDING,
                                VslStepStatus.PROCESSING,
                            ],
                        },
                    },
                    transaction,
                },
            );
        });

        logger.info('VSL run stopped', {
            vslRunId: runId,
            reason,
        });
    }

    // Cancels a claimed step if its run is no longer active.
    private async cancelStep(
        stepId: number,
        now: Date,
    ): Promise<void> {
        await VslStep.update(
            {
                status: VslStepStatus.CANCELLED,
                processedAt: now,
                lastError: 'VSL run is no longer active.',
            },
            {
                where: {
                    id: stepId,
                    status: VslStepStatus.PROCESSING,
                },
            },
        );
    }

    // Marks a step as failed when it cannot be processed automatically.
    private async markStepFailed(
        stepId: number,
        reason: string,
        now: Date,
    ): Promise<void> {
        await VslStep.update(
            {
                status: VslStepStatus.FAILED,
                processedAt: now,
                lastError: reason,
            },
            {
                where: {
                    id: stepId,
                    status: VslStepStatus.PROCESSING,
                },
            },
        );

        logger.warn('VSL step could not be processed', {
            vslStepId: stepId,
            reason,
        });
    }

    // Checks whether the current hour falls within the configured send window.
    private isWithinSendWindow(now: Date): boolean {
        if (!vslConfig.SEND_WINDOW_ENABLED) {
            return true;
        }

        const hour = now.getHours();
        const start = vslConfig.SEND_WINDOW_START_HOUR;
        const end = vslConfig.SEND_WINDOW_END_HOUR;

        if (start === end) {
            return true;
        }

        return start < end
            ? hour >= start && hour < end
            : hour >= start || hour < end;
    }
}

export default VslStepEnqueueService;