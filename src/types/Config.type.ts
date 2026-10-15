export type ServerConfig = {
    PORT: number
    NODE_ENV?: string
    REDIS_PORT: number,
    REDIS_HOST: string
    REDIS_PASSWORD?: string
    REDIS_TLS: boolean
    TRUST_PROXY: number
}

export type RateLimitConfig = {
    WINDOW_MS: number
    MAX_REQUESTS: number
    WRITE_MAX_REQUESTS: number
}

export type QueueConfig = {
    JOB_ATTEMPTS: number
    RETRY_BACKOFF_MS: number
    FAILED_JOB_RETENTION_DAYS: number
    FAILED_JOB_RETENTION_COUNT: number
}

export type DBConfig = {
    DB_HOST: string
    DB_USER: string
    DB_PASSWORD: string
    DB_NAME: string
    DB_SSL: boolean
    DB_SSL_CA_PATH: string
}

export type FrontendConfig = {
    ADMIN_FRONTEND_URL: string,
    CANDIDATE_FRONTEND_URL: string,
}

export type InternalApiConfig = {
    INTERNAL_API_KEY: string
    INTERNAL_API_KEY_HEADER: string
}

export type WorkrIntegrationConfig = {
    API_KEY: string
    API_KEY_HEADER: string
}

export type InternalServiceConfig = {
    BASE_URL: string
    TIMEOUT_MS: number
}

export type ReminderConfig = {
    FIRST_DELAY_MS: number
    GAP_MS: number
}

export type VslConfig = {
    ENABLED: boolean
    DRY_RUN: boolean
    CRON_EXPRESSION: string
    ENROLL_MIN_AGE_MINUTES: number
    ENROLL_MAX_AGE_MINUTES: number
    STEP_UNIT_MINUTES: number
    TOO_LATE_MINUTES: number
    SEND_WINDOW_START_HOUR: number
    SEND_WINDOW_END_HOUR: number
    FORM_SLUGS: string[]
    TEST_ALLOWLIST: string[]
}