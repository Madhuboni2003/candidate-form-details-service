import cron from 'node-cron';

import logger from '../configs/logger.config';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import CandidateSubmissionService from '../services/CandidateSubmission.service';

const candidateSubmissionService = new CandidateSubmissionService(
    new CandidateSubmissionRepository()
);

export function bookingReminderCron(): void {
    cron.schedule('*/2 * * * * ', async () => {
        try {
            await candidateSubmissionService.sendReminderNotificationForPendingBookings();
        } catch (error) {
            logger.error('Something went wrong', error);
        }
    });
}