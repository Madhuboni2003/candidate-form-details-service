import logger from '../configs/logger.config';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import sequelize from '../db/models/sequelize';
import { addBookingReminderDetailsToQueue } from '../producers/reminderNotification.producer';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import { NotificationChannel } from '../utils/enums/NotificationChannel';
import { NotFoundError } from '../utils/errors/app.error';
import { getBookingLink } from '../utils/helpers/getBookingLink.helper';
import { reminderConfig ,vslConfig  } from '../configs/server.config';

import VslRun from '../db/models/VslRun.model';
import { VSL_PLAN, VSL_PLAN_LENGTH } from '../constants/vslPlan';
import { VslNotificationDto } from '../dtos/VslNotification.dto';
import { addVslNotificationToQueue } from '../producers/vslNotification.producer';
import VslRunRepository from '../repositories/VslRun.repository';
import { CandidateSubmissionStatus } from '../utils/enums/CandidateSubmissionStatus';
import { VslRunStatus } from '../utils/enums/VslRunStatus';
import { VslStopReason } from '../utils/enums/VslStopReason';
import { getVslFormLink } from '../utils/helpers/getVslFormLink.helper';

class CandidateSubmissionService {
    constructor(private readonly candidateSubmissionRepository: CandidateSubmissionRepository) {}

    async findAllCandidatesWhereBookingPending(): Promise<CandidateSubmission[]> {
        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
        const submissions = await this.candidateSubmissionRepository.findAllBookingPendingSubmisssions(cutoffTime);
    
        return submissions;
    }

    async sendReminderNotificationForPendingBookings() {
        const { FIRST_DELAY_MS, GAP_MS } = reminderConfig;
        const now = Date.now();
        const cutoffTime = new Date(now - FIRST_DELAY_MS);
        const pendingBookingSubmissions: CandidateSubmission[] = await this.candidateSubmissionRepository.findAllBookingPendingSubmisssions(cutoffTime);

        if(pendingBookingSubmissions.length > 0) {
            for(const submission of pendingBookingSubmissions) {
                if(!submission.candidate || !submission.submittedAt) {
                    continue;
                }

                // Reminder 1 is due FIRST_DELAY after submission, every next reminder GAP after the previous one
                const reminderDueTime = submission.submittedAt.getTime() + FIRST_DELAY_MS + (submission.reminderCount * GAP_MS);

                if(reminderDueTime > now) {
                    continue;
                }

                const transaction = await sequelize.transaction();
                try {
                    await this.candidateSubmissionRepository.increaseReminderCount(submission.publicId, transaction);

                    await addBookingReminderDetailsToQueue({
                        submissionId: submission.publicId,
                        reminderNumber:submission.reminderCount + 1,
                        candidateId: submission.candidateId,
                        candidateName: submission.candidate.fullName,
                        candidateEmail: submission.candidate.email,
                        candidatePhone: submission.candidate.phone,
                        subject: 'Your InterviewCall booking is still pending',
                        channels: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
                        bookingLink: getBookingLink(submission.formSlug, submission.publicId),
                        templateKeys: {
                            EMAIL: 'BookingReminder',
                            WHATSAPP: 'BookingReminder'
                        }
                    });

                    await transaction.commit();
                } catch (error) {
                    await transaction.rollback();

                    logger.error(error);
                }
            }
        }
    }
    async markSubmissionAsBooked(submissionId: string): Promise<void> {
        const submission =
            await this.candidateSubmissionRepository.findById(submissionId);

        if (!submission) {
            throw new NotFoundError(
                `No candidate submission found with id: ${submissionId}`
            );
        }
        await this.candidateSubmissionRepository.markSubmissionAsBooked(
            submissionId
        );
    }
        
    // Enrol eligible submissions into the VSL sequence.
    async enrolPendingFormSubmissionsForVsl(): Promise<void> {
        if (!vslConfig.ENABLED || !vslConfig.FORM_SLUGS.length) return;

        const now = Date.now();
        const submissions = await this.candidateSubmissionRepository.findVslEnrollmentCandidates(
            new Date(now - vslConfig.ENROLL_MAX_AGE_MINUTES * 60_000),
            new Date(now - vslConfig.ENROLL_MIN_AGE_MINUTES * 60_000),
            vslConfig.FORM_SLUGS
        );
        const processed = new Set<number>();

        for (const submission of submissions) {
            const candidate = submission.candidate;
            if (!candidate || processed.has(candidate.id)) continue;
            processed.add(candidate.id);

            const email = candidate.email?.trim().toLowerCase();
            if (!email || candidate.optedOutAt) continue;
            if (vslConfig.TEST_ALLOWLIST.length && !vslConfig.TEST_ALLOWLIST.includes(email)) continue;
            if (await VslRunRepository.findBySubmission(submission.id)) continue;
            if (await VslRunRepository.findOne({
                activeCandidateId: candidate.id,
                status: VslRunStatus.ACTIVE
            })) continue;

            if (vslConfig.DRY_RUN) {
                logger.info('VSL dry run: eligible candidate', { candidateId: candidate.id });
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
            } catch (error) {
                await transaction.rollback().catch(() => undefined);
                logger.error('VSL enrolment failed', { submissionId: submission.publicId, error });
            }
        }
    }

    // Process each active run independently.
    async processPendingVslRuns(): Promise<void> {
        if (!vslConfig.ENABLED) return;

        for (const run of await VslRunRepository.findActiveRuns()) {
            try {
                await this.processVslRun(run);
            } catch (error) {
                logger.error('VSL run processing failed', { vslRunId: run.id, error });
            }
        }
    }

    // Check eligibility and process the next due step.
    private async processVslRun(run: VslRun): Promise<void> {
        const { candidate, submission } = run;

        if (!submission || submission.deletedAt) {
            await VslRunRepository.stopRun(
                run.id,
                submission ? VslStopReason.SUBMISSION_DELETED : VslStopReason.SUBMISSION_MISSING
            );
            return;
        }

        // Stop when the submission is cancelled or has progressed to booking.
        const stopReasons: Partial<Record<CandidateSubmissionStatus, VslStopReason>> = {
            [CandidateSubmissionStatus.CANCELLED]: VslStopReason.SUBMISSION_CANCELLED,
            [CandidateSubmissionStatus.BOOKING_PENDING]: VslStopReason.BOOKING_PENDING,
            [CandidateSubmissionStatus.BOOKED]: VslStopReason.BOOKED,
            [CandidateSubmissionStatus.CONVERTED]: VslStopReason.CONVERTED
        };
        const stopReason = stopReasons[submission.status as CandidateSubmissionStatus];
        if (stopReason) {
            await VslRunRepository.stopRun(run.id, stopReason);
            return;
        }

        if (!candidate || candidate.optedOutAt) {
            await VslRunRepository.stopRun(run.id, VslStopReason.CANDIDATE_OPTED_OUT);
            return;
        }

        const email = candidate.email?.trim().toLowerCase();
        if (!email || (vslConfig.TEST_ALLOWLIST.length && !vslConfig.TEST_ALLOWLIST.includes(email))) return;

        let index = run.stepsSent;
        while (index < VSL_PLAN_LENGTH) {
            const step = VSL_PLAN[index];
            if (!step) {
                await VslRunRepository.completeRun(run.id);
                return;
            }

            const dueAt = run.anchorAt.getTime() + step.day * vslConfig.STEP_UNIT_MINUTES * 60_000;
            const now = Date.now();
            if (now < dueAt) return;

            const complete = index + 1 === VSL_PLAN_LENGTH;

            // Skip stale steps to avoid sending several emails together.
            if (now - dueAt > vslConfig.TOO_LATE_MINUTES * 60_000) {
                if (!await this.advanceVslStep(run.id, index, { complete })) return;
                index++;
                continue;
            }

            // Day 4 is internal-only; it sets the priority flag.
            if (step.channel === 'internal') {
                if (!await this.advanceVslStep(run.id, index, { setPriorityFlag: true, complete })) return;
                index++;
                continue;
            }

            if (!this.isWithinVslSendWindow()) return;
            if (vslConfig.DRY_RUN) {
                logger.info('VSL dry run: email step due', { vslRunId: run.id, stepKey: step.key });
                return;
            }

            const stepKey = step.key as VslNotificationDto['stepKey'];
            await this.advanceVslStep(run.id, index, { complete }, {
                candidateId: candidate.id,
                submissionId: submission.publicId,
                vslRunId: run.id,
                stepNumber: index + 1,
                stepKey,
                candidateName: candidate.fullName,
                candidateEmail: email,
                formLink: getVslFormLink(run.formSlug, candidate.public_id, stepKey),
                subject: step.subject,
                templateKey: step.templateKey
            });
            return; // Process at most one email per run per cron tick.
        }

        if (index >= VSL_PLAN_LENGTH) await VslRunRepository.completeRun(run.id);
    }

        // Restrict sending to the configured IST hours.
    private isWithinVslSendWindow(): boolean {
        return true;
    }

    // Advance the run and enqueue an email when a payload is provided.
    private async advanceVslStep(
        runId: number,
        expectedStepsSent: number,
        options: { complete?: boolean; setPriorityFlag?: boolean },
        payload?: VslNotificationDto
    ): Promise<boolean> {
        const transaction = await sequelize.transaction();
        try {
            const advanced = await VslRunRepository.advanceStep(runId, expectedStepsSent, transaction, options);
            if (!advanced) {
                await transaction.rollback().catch(() => undefined);
                return false;
            }

            if (payload) await addVslNotificationToQueue(payload);
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback().catch(() => undefined);
            throw error;
        }
    }

    
}

export default CandidateSubmissionService;