import { Queue } from 'bullmq';

import { bullMqConnection } from '../configs/bullmq.config';
import { defaultJobOptions } from '../configs/queueOptions.config';
import { VSL_NOTIFICATION_QUEUE } from '../constants';
import { VslNotificationDto } from '../dtos/VslNotification.dto';

// Creates the BullMQ queue for VSL notification jobs.
const vslNotificationQueue = new Queue<VslNotificationDto>(
    VSL_NOTIFICATION_QUEUE,
    {
        connection: bullMqConnection,
        defaultJobOptions,
    },
);

export default vslNotificationQueue;