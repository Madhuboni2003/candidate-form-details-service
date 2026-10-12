// The way a step of the VSL chain reaches its target.
export enum VslStepChannel {
    // a mail to the candidate, sent by the notification service
    EMAIL = 'email',
    // no message to the candidate: a follow-up task for the sales team
    INTERNAL = 'internal'

   //WHATSAPP = 'WHATSAPP'
}