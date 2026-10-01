import dotenv from 'dotenv';

type ServerConfig = {
    PORT: number
    NODE_ENV?: string
    REDIS_PORT: number,
    REDIS_HOST: string
}

type QueueConfig = {
    JOB_ATTEMPTS: number
    RETRY_BACKOFF_MS: number
    FAILED_JOB_RETENTION_DAYS: number
    FAILED_JOB_RETENTION_COUNT: number
}

type DBConfig = {
    DB_HOST: string
    DB_USER: string
    DB_PASSWORD: string
    DB_NAME: string
}

type FrontendConfig = {
    ADMIN_FRONTEND_URL: string,
    CANDIDATE_FRONTEND_URL: string,
}

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