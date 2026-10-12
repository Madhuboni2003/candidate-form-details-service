// Where a candidate's VSL follow-up chain (one "run") stands.
export enum VslRunStatus {
    // the chain is going on: there are still mails to send
    ACTIVE = 'active',
    // every step was handled and the chain reached its end
    COMPLETED = 'completed',
    // the chain was cut short, see VslStopReason for why
    STOPPED = 'stopped'
}