import cron from 'node-cron';

import logger from '../configs/logger.config';
import { vslConfig } from '../configs/server.config';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import VslRunRepository from '../repositories/VslRun.repository';
import VslStepRepository from '../repositories/VslStep.repository';
import VslEnrolService from '../services/VslEnrol.service';
import VslStepEnqueueService from '../services/VslStepEnqueue.service';

const vslStepRepository = new VslStepRepository();

const vslEnrolService = new VslEnrolService(
    new CandidateSubmissionRepository(),
    new VslRunRepository(),
    vslStepRepository,
);

const vslStepEnqueueService = new VslStepEnqueueService(
    vslStepRepository,
);

// Runs the VSL enrollment sweep and due-step enqueue process on schedule.
export function vslCron(): void {
    cron.schedule(vslConfig.SWEEP_CRON, async () => {
        const now = new Date();

        try {
            // Finds eligible submissions and creates their VSL runs and steps.
            await vslEnrolService.runEnrollmentSweep(now);

            // Rechecks candidates and enqueues notifications for due steps.
            await vslStepEnqueueService.enqueueDueSteps(now);
        } catch (error: unknown) {
            logger.error('VSL scheduled sweep failed', { error });
        }
    });
}