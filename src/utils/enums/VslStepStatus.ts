// Where one step of the chain (for example the Day 1 mail) stands.
export enum VslStepStatus {
    // planned, its time has not come yet (or it is waiting to be picked up)
    PENDING = 'pending',
    // picked up by the sweeper and being handled right now
    PROCESSING = 'processing',
    // handed over to the notification queue (or the task was created)
    SENT = 'sent',
    // deliberately not sent, the reason is saved (for example: too late, unsubscribed)
    SKIPPED = 'skipped',
    // the chain stopped before this step was due
    CANCELLED = 'cancelled',
    // could not be handed over even after retries
    FAILED = 'failed'
}