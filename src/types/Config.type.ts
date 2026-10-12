export type ServerConfig = {
    PORT: number
    NODE_ENV?: string
    REDIS_PORT: number,
    REDIS_HOST: string
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
}

export type FrontendConfig = {
    ADMIN_FRONTEND_URL: string,
    CANDIDATE_FRONTEND_URL: string,
}

export type InternalApiConfig = {
    INTERNAL_API_KEY: string
    INTERNAL_API_KEY_HEADER: string
}

export type InternalServiceConfig = {
    BASE_URL: string
    TIMEOUT_MS: number
}

// Settings of the VSL abandonment follow-up chain.
export type VslConfig = {
    // master switch: when false the sweeper does nothing
    ENABLED: boolean

    // when true, eligible candidates are not enrolled in the database
    ENROLLMENT_DRY_RUN: boolean

    // when true, due steps are not claimed or enqueued for notification
    DRY_RUN: boolean
    // how often the sweeper runs (cron expression)
    SWEEP_CRON: string
    // length of one "day" of the chain in minutes (1440 in production, 1 while testing)
    STEP_UNIT_MINUTES: number
    // a candidate enters the chain this long after submitting the details popup
    ENROLL_MIN_AGE_MINUTES: number
    // candidates whose popup is older than this are never enrolled
    ENROLL_MAX_AGE_MINUTES: number
    // a step that is later than this is skipped instead of sent
    TOO_LATE_MINUTES: number
    // when true, mails go out only between the two hours below (India time)
    SEND_WINDOW_ENABLED: boolean
    SEND_WINDOW_START_HOUR: number
    SEND_WINDOW_END_HOUR: number
    // only candidates from these landing pages get the chain
    ELIGIBLE_FORM_SLUGS: string[]
    // when not empty, only these emails get the chain (safety net for test mode)
    TEST_EMAIL_ALLOWLIST: string[]
    // most candidates or steps handled in one sweep
    BATCH_SIZE: number
}