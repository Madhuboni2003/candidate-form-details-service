import { VslStepKey } from '../utils/enums/VslStepKey';

export type VslNotificationDto = {
    candidateId: number;
    submissionId: string; // CandidateSubmission public UUID.
    vslRunId: number;
    stepNumber: number;
    stepKey: VslStepKey.D1_EMAIL | VslStepKey.D3_EMAIL | VslStepKey.D7_EMAIL;
    candidateName: string;
    candidateEmail: string;
    formLink: string;
    subject: string;
    templateKey: string;
    unsubscribeLink?: string;
};