import { NotificationChannel } from '../utils/enums/NotificationChannel.enum';

export type BookingReminderNotificationDto = {
    candidateId: number;
    submissionId: string;
    reminderNumber: number;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    bookingLink: string;
    subject: string;
    channels: NotificationChannel[];
    templateKeys: Record<NotificationChannel, string>;
};