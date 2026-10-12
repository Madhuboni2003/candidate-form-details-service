import { CreationAttributes, Op, Transaction } from 'sequelize';

import Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import VslRun from '../db/models/VslRun.model';
import VslStep from '../db/models/VslStep.model';
import sequelize from '../db/models/sequelize';
import { VslStepKey } from '../utils/enums/VslStepKey';
import { VslStepStatus } from '../utils/enums/VslStepStatus';
import BaseRepository from './Base.repository';
import { VslRunStatus } from '../utils/enums/VslRunStatus';

class VslStepRepository extends BaseRepository<VslStep> {
    // Initializes the repository with the VslStep model.
    constructor() {
        super(VslStep);
    }

    // Finds all steps belonging to a particular VSL run.
    async findByRunId(
        runId: number,
        transaction?: Transaction,
    ): Promise<VslStep[]> {
        return await this.model.findAll({
            where: { runId },
            order: [['dayNumber', 'ASC']],
            transaction,
        });
    }

    // Finds a specific step using its run ID and step key.
    async findByRunAndStepKey(
        runId: number,
        stepKey: VslStepKey,
        transaction?: Transaction,
    ): Promise<VslStep | null> {
        return await this.model.findOne({
            where: { runId, stepKey },
            transaction,
        });
    }

    // Creates a step only if the same step does not already exist for the run.
    async createIfAbsent(
        data: CreationAttributes<VslStep>,
        transaction?: Transaction,
    ): Promise<[VslStep, boolean]> {
        return await this.model.findOrCreate({
            where: {
                runId: data.runId,
                stepKey: data.stepKey,
            },
            defaults: data,
            transaction,
        });
    }

    // Claims due pending steps and loads the run, candidate, and submission details.
    async claimDuePendingSteps(
        limit = 100,
        now = new Date(),
    ): Promise<VslStep[]> {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new Error('limit must be a positive integer');
        }

        return await sequelize.transaction(async (transaction) => {
            const steps = await this.model.findAll({
                where: {
                    status: VslStepStatus.PENDING,
                    dueAt: {
                        [Op.lte]: now,
                    },
                },

                include: [
                    {
                        model: VslRun,
                        as: 'run',
                        required: true,
                        include: [
                            {
                                model: Candidate,
                                as: 'candidate',
                                required: true,
                                attributes: [
                                    'id',
                                    'fullName',
                                    'email',
                                    'phone',
                                    'emailUnsubscribedAt',
                                    'optedOutAt',
                                ],
                            },
                            {
                                model: CandidateSubmission,
                                as: 'submission',
                                required: true,
                                attributes: [
                                    'id',
                                    'publicId',
                                    'status',
                                    'formSlug',
                                    'createdAt',
                                ],
                            },
                        ],
                    },
                ],

                order: [
                    ['dueAt', 'ASC'],
                    ['id', 'ASC'],
                ],

                limit,
                transaction,
                lock: transaction.LOCK.UPDATE,
                skipLocked: true,
            });

            if (steps.length === 0) {
                return [];
            }

            const stepIds = steps.map((step) => step.id);

            await this.model.update(
                {
                    status: VslStepStatus.PROCESSING,
                    claimedAt: now,
                },
                {
                    where: {
                        id: {
                            [Op.in]: stepIds,
                        },
                        status: VslStepStatus.PENDING,
                    },
                    transaction,
                },
            );

            for (const step of steps) {
                step.status = VslStepStatus.PROCESSING;
                step.claimedAt = now;
            }

            return steps;
        });
    }

        /**
     * Applies a terminal notification result to its VSL step.
     * Validates the run and submission identity, ignores duplicate/stale results,
     * and completes the run when no pending or processing steps remain.
     */
    async applyNotificationResult(
        result: {
            vslRunId: number;
            vslStepId: number;
            submissionId: string;
            status: 'SENT' | 'FAILED';
            errorMessage?: string;
        },
        now: Date = new Date(),
    ): Promise<'updated' | 'ignored'> {
        return await sequelize.transaction(async (transaction) => {
            // Lock the run first, matching the run-then-steps lock order used elsewhere.
            const run = await VslRun.findByPk(result.vslRunId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!run) {
                throw new Error(`VSL run ${result.vslRunId} was not found`);
            }

            const step = await this.model.findByPk(result.vslStepId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!step || step.runId !== run.id) {
                throw new Error(
                    `VSL step ${result.vslStepId} does not belong to run ${result.vslRunId}`,
                );
            }

            // Verify the public submission identity before accepting the result.
            const submission = await CandidateSubmission.findByPk(
                run.submissionId,
                { transaction },
            );

            if (!submission || submission.publicId !== result.submissionId) {
                throw new Error(
                    `Submission identity mismatch for VSL step ${result.vslStepId}`,
                );
            }

            // A stopped run or already-handled step must not be overwritten.
            if (
                run.status !== VslRunStatus.ACTIVE ||
                step.status !== VslStepStatus.PROCESSING
            ) {
                return 'ignored';
            }

            step.status =
                result.status === 'SENT'
                    ? VslStepStatus.SENT
                    : VslStepStatus.FAILED;

            step.processedAt = now;
            step.claimedAt = null;
            step.lastError =
                result.status === 'FAILED'
                    ? result.errorMessage ?? 'Notification delivery failed'
                    : null;

            await step.save({ transaction });

            // Complete the run only after every step has reached a terminal status.
            const unfinishedSteps = await this.model.count({
                where: {
                    runId: run.id,
                    status: {
                        [Op.in]: [
                            VslStepStatus.PENDING,
                            VslStepStatus.PROCESSING,
                        ],
                    },
                },
                transaction,
            });

            if (unfinishedSteps === 0) {
                run.status = VslRunStatus.COMPLETED;
                run.completedAt = now;
                run.activeCandidateId = null;

                await run.save({ transaction });
            }

            return 'updated';
        });
    }
}



export default VslStepRepository;