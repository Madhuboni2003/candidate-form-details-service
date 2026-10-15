import { frontendConfig } from '../../configs/server.config';
import { VslStepKey } from '../enums/VslStepKey';

// Builds the candidate-specific form link with VSL tracking parameters.
export function getVslFormLink(
    formSlug: string,
    candidatePublicId: string,
    stepKey: VslStepKey
): string {
    const baseUrl = frontendConfig.CANDIDATE_FRONTEND_URL.replace(/\/$/, '');
    const params = new URLSearchParams({
        'candidate-id': candidatePublicId,
        utm_source: 'vsl_nurture',
        utm_campaign: stepKey
    });

    return `${baseUrl}/${formSlug}?${params.toString()}`;
}