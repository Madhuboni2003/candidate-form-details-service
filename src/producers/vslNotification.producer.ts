import logger from '../configs/logger.config';
import { VSL_NOTIFICATION_PAYLOAD } from '../constants';
import { VslNotificationDto } from '../dtos/VslNotification.dto';
import vslNotificationQueue from '../queues/vslNotification.queue';

// Enqueues an email step with a stable ID to prevent duplicate jobs.
export async function addVslNotificationToQueue(
    payload: VslNotificationDto
): Promise<void> {
    await vslNotificationQueue.add(
        VSL_NOTIFICATION_PAYLOAD,
        payload,
        {
            jobId: `vsl-run-${payload.vslRunId}-${payload.stepKey}`
        }
    );

    logger.info('VSL notification added to queue', {
        vslRunId: payload.vslRunId,
        stepKey: payload.stepKey
    });
}