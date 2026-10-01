import { JobsOptions } from 'bullmq';

import { queueConfig } from './server.config';

const SECONDS_IN_A_DAY = 24 * 60 * 60;

/**
 * Applied to every job this service adds to the notification queue.
 * Delivered jobs are removed immediately; failed jobs are retried and then kept for inspection.
 */
export const defaultJobOptions: JobsOptions = {
    attempts: queueConfig.JOB_ATTEMPTS,
    backoff: {
        type: 'exponential',
        delay: queueConfig.RETRY_BACKOFF_MS
    },
    removeOnComplete: true,
    removeOnFail: {
        age: queueConfig.FAILED_JOB_RETENTION_DAYS * SECONDS_IN_A_DAY,
        count: queueConfig.FAILED_JOB_RETENTION_COUNT
    }
};
