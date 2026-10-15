
import cron from 'node-cron';

import logger from '../configs/logger.config';
import { vslConfig } from '../configs/server.config';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import CandidateSubmissionService from '../services/CandidateSubmission.service';

const candidateSubmissionService = new CandidateSubmissionService(
    new CandidateSubmissionRepository(),
);

// Runs VSL enrollment and due-step processing on schedule.
export function vslCron(): void {
        cron.schedule(vslConfig.CRON_EXPRESSION, async () => {
        logger.info('VSL cron triggered');

        try {
            await candidateSubmissionService.enrolPendingFormSubmissionsForVsl();
            logger.info('VSL enrollment sweep finished');

            await candidateSubmissionService.processPendingVslRuns();
            logger.info('VSL run processing finished');
        } catch (error: unknown) {
            logger.error('VSL scheduled sweep failed', { error });
        }
    });
}
