import { NotificationChannel } from '../utils/enums/NotificationChannel';
import { VslStepKey } from '../utils/enums/VslStepKey';

// Defines the payload sent through the VSL notification queue.
export type VslNotificationDto = {
    candidateId: number;
    submissionId: string;

    vslRunId: number;
    vslStepId: number;
    stepKey: VslStepKey;

    candidateName: string;
    candidateEmail: string;
    formLink: string;
    subject: string;

    channels: NotificationChannel[];
    templateKeys: Partial<Record<NotificationChannel, string>>;
};