
import { UnrecoverableError, Worker } from 'bullmq';

import { bullMqConnection } from '../configs/bullmq.config';
import logger from '../configs/logger.config';
import {
    VSL_NOTIFICATION_RESULT_PAYLOAD,
    VSL_NOTIFICATION_RESULT_QUEUE
} from '../constants';
import {
    VslNotificationResultDto,
    vslNotificationResultSchema
} from '../dtos/VslNotificationResult.dto';
import VslStepRepository from '../repositories/VslStep.repository';

/**
 * Registers the worker that consumes terminal VSL notification results.
 * Validates each result before applying it to the form service database.
 */
export function setupVslNotificationResultProcessor(): void {
    const vslStepRepository = new VslStepRepository();

    const vslResultProcessor = new Worker<VslNotificationResultDto>(
        VSL_NOTIFICATION_RESULT_QUEUE,
        async (job) => {
            // Retrying cannot fix an unknown job name.
            if (job.name !== VSL_NOTIFICATION_RESULT_PAYLOAD) {
                throw new UnrecoverableError(
                    'Invalid VSL notification result job name',
                );
            }

            // Validate data received from the notification service.
            const parsed = vslNotificationResultSchema.safeParse(job.data);

            if (!parsed.success) {
                const reasons = parsed.error.issues
                    .map(
                        (issue) =>
                            `${issue.path.join('.')}: ${issue.message}`,
                    )
                    .join('; ');

                throw new UnrecoverableError(
                    `Invalid VSL notification result payload: ${reasons}`,
                );
            }

            const result = parsed.data;

            // Apply the terminal result idempotently to the matching VSL step.
            const outcome = await vslStepRepository.applyNotificationResult({
                vslRunId: result.vslRunId,
                vslStepId: result.vslStepId,
                submissionId: result.submissionId,
                status: result.status,
                errorMessage: result.errorMessage,
            });

            logger.info('VSL notification result processed', {
                jobId: job.id,
                vslRunId: result.vslRunId,
                vslStepId: result.vslStepId,
                status: result.status,
                outcome,
            });
        },
        {
            connection: bullMqConnection,
            concurrency: 5,
        },
    );

    vslResultProcessor.on('completed', (job) => {
        logger.info('VSL notification result job completed', {
            jobId: job.id,
            jobName: job.name,
        });
    });

    vslResultProcessor.on('failed', (job, error) => {
        logger.error('VSL notification result job failed', {
            jobId: job?.id,
            jobName: job?.name,
            attemptsMade: job?.attemptsMade,
            error,
        });
    });

    logger.info('VSL notification result processor setup completed');
}
