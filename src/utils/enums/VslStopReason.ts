// Why a candidate's VSL chain was stopped before its end.
export enum VslStopReason {
    // the candidate finished the qualification form
    FORM_SUBMITTED = 'form_submitted',
    // the candidate booked a slot
    BOOKED = 'booked',
    // the candidate was converted
    CONVERTED = 'converted',
    // the submission was cancelled
    SUBMISSION_CANCELLED = 'submission_cancelled',
    // the candidate asked us to stop all messages
    OPTED_OUT = 'opted_out',
    // the candidate unsubscribed from our mails
    UNSUBSCRIBED = 'unsubscribed',

    // The four below are not visible in our own data (they live in the CRM),
    // so for now they only arrive through the manual stop endpoint.
    NOT_INTERESTED = 'not_interested',
    WON = 'won',
    ENROLLED = 'enrolled',
    LATER_STAGE = 'later_stage',

    OTHER = 'other'
}