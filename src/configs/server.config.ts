import dotenv from 'dotenv';

import { DBConfig, FrontendConfig, InternalApiConfig, InternalServiceConfig, QueueConfig, RateLimitConfig, ReminderConfig, ServerConfig,VslConfig, WorkrIntegrationConfig } from '../types/Config.type';

dotenv.config();

export const serverConfig: ServerConfig =  {
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    // Managed Redis (ElastiCache) runs with an auth token and in-transit encryption
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    REDIS_TLS: process.env.REDIS_TLS == 'true',
    // Number of reverse proxies (Caddy, ...) sitting in front of the app; needed so req.ip is the real client IP
    TRUST_PROXY: Number(process.env.TRUST_PROXY ?? 1)
};

// Connection options shared by every Redis client (ioredis, BullMQ, locks)
export const redisAuthOptions = {
    ...(serverConfig.REDIS_PASSWORD ? { password: serverConfig.REDIS_PASSWORD } : {}),
    ...(serverConfig.REDIS_TLS ? { tls: {} } : {})
};

// Limits are per client IP. Kept generous on purpose: many candidates share one public IP
// (college Wi-Fi, mobile carrier NAT) and this is an open, unauthenticated funnel.
export const rateLimitConfig: RateLimitConfig = {
    WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX) || 600,
    WRITE_MAX_REQUESTS: Number(process.env.RATE_LIMIT_WRITE_MAX) || 60
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
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'ic_lead',
    // RDS: encrypt the connection and verify the server against the AWS CA bundle
    DB_SSL: process.env.DB_SSL == 'true',
    DB_SSL_CA_PATH: process.env.DB_SSL_CA_PATH || '/app/certs/rds-global-bundle.pem'
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

// WorkR (a different server, reaching this service over the public API domain) asks which of its users already registered here.
// It gets its own key, separate from the internal one, so a leaked WorkR key cannot read submissions or call the other services.
export const workrIntegrationConfig: WorkrIntegrationConfig = {
    API_KEY: process.env.WORKR_INTEGRATION_API_KEY || '',
    API_KEY_HEADER: process.env.WORKR_INTEGRATION_API_KEY_HEADER || 'x-workr-api-key'
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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// Reminders for candidates who submitted the form but have not booked a slot.
// FIRST_DELAY_MS: time after submission for reminder 1; GAP_MS: time between reminders.
export const reminderConfig: ReminderConfig = {
    FIRST_DELAY_MS: 10 * MINUTE_MS,
    GAP_MS: 6 * HOUR_MS
};


export const vslConfig: VslConfig = {
    ENABLED: process.env.VSL_ENABLED === 'true',
    DRY_RUN: process.env.VSL_DRY_RUN !== 'false',
    CRON_EXPRESSION: process.env.VSL_SWEEP_CRON || '*/15 * * * *',
    ENROLL_MIN_AGE_MINUTES: Number(process.env.VSL_ENROLL_MIN_AGE_MINUTES) || 10,
    ENROLL_MAX_AGE_MINUTES: Number(process.env.VSL_ENROLL_MAX_AGE_MINUTES) || 21600,
    STEP_UNIT_MINUTES: Number(process.env.VSL_STEP_UNIT_MINUTES) || 1440,
    TOO_LATE_MINUTES: Number(process.env.VSL_TOO_LATE_MINUTES) || 1440,
    SEND_WINDOW_START_HOUR: Number(process.env.VSL_SEND_WINDOW_START_HOUR) || 9,
    SEND_WINDOW_END_HOUR: Number(process.env.VSL_SEND_WINDOW_END_HOUR) || 21,
    FORM_SLUGS: (process.env.VSL_FORM_SLUGS || '').split(',').map(s => s.trim()).filter(Boolean),
    TEST_ALLOWLIST: (process.env.VSL_TEST_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
};