import dotenv from 'dotenv';

import { DBConfig, FrontendConfig, InternalApiConfig, InternalServiceConfig, QueueConfig, ServerConfig ,VslConfig} from '../types/Config.type';
import { readBooleanEnv, readListEnv } from '../utils/helpers/env.helper';

dotenv.config();

export const serverConfig: ServerConfig =  {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379
};

// Job retry / retention policy for the notification queue this service produces into.
// Keep in sync with the notification service: a job's own options win over the worker's.
//  - a job that succeeds is deleted from Redis immediately
//  - a job that fails is retried JOB_ATTEMPTS times in total (exponential backoff starting at RETRY_BACKOFF_MS)
//  - once all attempts are used it stays in the "failed" set for FAILED_JOB_RETENTION_DAYS (max FAILED_JOB_RETENTION_COUNT)
export const queueConfig: QueueConfig = {
    JOB_ATTEMPTS: Number(process.env.QUEUE_JOB_ATTEMPTS) || 5,
    RETRY_BACKOFF_MS: Number(process.env.QUEUE_RETRY_BACKOFF_MS) || 30 * 1000,
    FAILED_JOB_RETENTION_DAYS: Number(process.env.QUEUE_FAILED_RETENTION_DAYS) || 1,
    FAILED_JOB_RETENTION_COUNT: Number(process.env.QUEUE_FAILED_RETENTION_COUNT) || 5000
};

export const dbConfig: DBConfig = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '1748arijiT#',
    DB_NAME: process.env.DB_NAME || 'ic_lead',
};

export const frontendConfig: FrontendConfig = {
    ADMIN_FRONTEND_URL: String(process.env.ADMIN_FRONTEND_URL),
    CANDIDATE_FRONTEND_URL: String(process.env.CANDIDATE_FRONTEND_URL)
};

// Shared secret for service-to-service calls, in both directions: the header name and key must match the other services.
export const internalApiConfig: InternalApiConfig = {
    INTERNAL_API_KEY: process.env.SCHEDULER_INTERNAL_API_KEY || '',
    INTERNAL_API_KEY_HEADER: process.env.INTERNAL_API_KEY_HEADER || 'x-internal-api-key'
};

// The slot-booking-service: the admin submission pages ask it which bookings belong to a page of submissions.
export const bookingServiceConfig: InternalServiceConfig = {
    BASE_URL: process.env.BOOKING_SERVICE_BASE_URL || 'http://localhost:3003/api/v1',
    TIMEOUT_MS: Number(process.env.BOOKING_SERVICE_TIMEOUT_MS) || 3000
};

// The notification-service: the admin submission detail page asks it which messages were sent.
export const notificationServiceConfig: InternalServiceConfig = {
    BASE_URL: process.env.NOTIFICATION_SERVICE_BASE_URL || 'http://localhost:3005/api/v1',
    TIMEOUT_MS: Number(process.env.NOTIFICATION_SERVICE_TIMEOUT_MS) || 3000
};

// VSL abandonment follow-up chain.
// The defaults below are the production values and they are safe: the chain is off,
// and if you switch it on it only logs (dry run) until you turn DRY_RUN off.
// For testing, override them in .env.
export const vslConfig: VslConfig = {
    ENABLED: readBooleanEnv('VSL_ENABLED', false),
    ENROLLMENT_DRY_RUN: readBooleanEnv(
        'VSL_ENROLLMENT_DRY_RUN',
        true,
    ),

    DRY_RUN: readBooleanEnv('VSL_DRY_RUN', true),
    SWEEP_CRON: process.env.VSL_SWEEP_CRON || '*/15 * * * *',
    STEP_UNIT_MINUTES: Number(process.env.VSL_STEP_UNIT_MINUTES) || 1440,
    ENROLL_MIN_AGE_MINUTES: Number(process.env.VSL_ENROLL_MIN_AGE_MINUTES) || 1440,
    ENROLL_MAX_AGE_MINUTES: Number(process.env.VSL_ENROLL_MAX_AGE_MINUTES) || 2880,
    TOO_LATE_MINUTES: Number(process.env.VSL_TOO_LATE_MINUTES) || 2880,
    SEND_WINDOW_ENABLED: readBooleanEnv('VSL_SEND_WINDOW_ENABLED', true),
    SEND_WINDOW_START_HOUR: Number(process.env.VSL_SEND_WINDOW_START_HOUR) || 9,
    SEND_WINDOW_END_HOUR: Number(process.env.VSL_SEND_WINDOW_END_HOUR) || 21,
    ELIGIBLE_FORM_SLUGS: readListEnv('VSL_ELIGIBLE_FORM_SLUGS', ['job-switch']),
    TEST_EMAIL_ALLOWLIST: readListEnv('VSL_TEST_EMAIL_ALLOWLIST'),
    BATCH_SIZE: Number(process.env.VSL_BATCH_SIZE) || 50
};
