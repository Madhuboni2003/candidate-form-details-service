import logger from '../configs/logger.config';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import sequelize from '../db/models/sequelize';
import { addBookingReminderDetailsToQueue } from '../producers/reminderNotification.producer';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import { NotificationChannel } from '../utils/enums/NotificationChannel.enum';
import { NotFoundError } from '../utils/errors/app.error';
import { getBookingLink } from '../utils/helpers/getBookingLink';

class CandidateSubmissionService {
    constructor(private readonly candidateSubmissionRepository: CandidateSubmissionRepository) {}

    async findAllCandidatesWhereBookingPending(): Promise<CandidateSubmission[]> {
        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
        const submissions = await this.candidateSubmissionRepository.findAllBookingPendingSubmisssions(cutoffTime);
    
        return submissions;
    }

    async sendReminderNotificationForPendingBookings() {
        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
        const pendingBookingSubmissions: CandidateSubmission[] = await this.candidateSubmissionRepository.findAllBookingPendingSubmisssions(cutoffTime);

        if(pendingBookingSubmissions.length > 0) {
            for(const submission of pendingBookingSubmissions) {
                if(!submission.candidate) {
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
}

export default CandidateSubmissionService;