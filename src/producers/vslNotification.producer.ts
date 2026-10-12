import logger from '../configs/logger.config';
import { VSL_NOTIFICATION_PAYLOAD } from '../constants';
import { VslNotificationDto } from '../dtos/VslNotification.dto';
import vslNotificationQueue from '../queues/vslNotification.queue';

// Enqueues a VSL notification job for the notification service to process.
export async function VslNotificationEnqueue(
    payload: VslNotificationDto,
): Promise<void> {
    await vslNotificationQueue.add(
        VSL_NOTIFICATION_PAYLOAD,
        payload,
        {
            jobId: `vsl-step-${payload.vslStepId}`,
        },
    );

    logger.info('VSL notification payload added to the queue', {
        vslRunId: payload.vslRunId,
        vslStepId: payload.vslStepId,
        stepKey: payload.stepKey,
    });
}