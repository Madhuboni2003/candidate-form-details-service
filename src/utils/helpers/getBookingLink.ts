import { frontendConfig } from '../../configs/server.config';

export function getBookingLink(
    formSlug: string,
    submissionId: string,
): string {
    return `${frontendConfig.CANDIDATE_FRONTEND_URL}/${formSlug}/book-strategy-call?submission-id=${submissionId}`;
}