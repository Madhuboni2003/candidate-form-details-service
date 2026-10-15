import { CreationAttributes, Transaction } from 'sequelize';

import Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import VslRun from '../db/models/VslRun.model';
import { VslRunStatus } from '../utils/enums/VslRunStatus';
import { VslStopReason } from '../utils/enums/VslStopReason';
import BaseRepository from './Base.repository';

class VslRunRepository extends BaseRepository<VslRun> {
    constructor() {
        super(VslRun);
    }

    // Creates a VSL run, optionally inside an existing transaction.
    async create(
        data: CreationAttributes<VslRun>,
        transaction?: Transaction
    ): Promise<VslRun> {
        return this.model.create(data, { transaction });
    }

    // Finds the VSL run linked to a submission.
    async findBySubmission(submissionId: number): Promise<VslRun | null> {
        return this.model.findOne({ where: { submissionId } });
    }

    // Fetches active runs with candidate and submission details for processing.
    async findActiveRuns(): Promise<VslRun[]> {
        return this.model.findAll({
            where: { status: VslRunStatus.ACTIVE },
            include: [
                { model: Candidate, as: 'candidate', required: true },
                { model: CandidateSubmission, as: 'submission', required: true }
            ],
            order: [['createdAt', 'ASC']]
        });
    }

    // Advances one step only if another worker hasn't already advanced this run.
    async advanceStep(
        id: number,
        expectedStepsSent: number,
        transaction: Transaction,
        options: { complete?: boolean; setPriorityFlag?: boolean } = {}
    ): Promise<boolean> {
        const now = new Date();

        const [updated] = await this.model.update({
            stepsSent: expectedStepsSent + 1,
            lastStepAt: now,
            ...(options.setPriorityFlag ? { priorityFlag: true } : {}),
            ...(options.complete ? {
                status: VslRunStatus.COMPLETED,
                activeCandidateId: null,
                completedAt: now
            } : {})
        }, {
            where: {
                id,
                status: VslRunStatus.ACTIVE,
                stepsSent: expectedStepsSent
            },
            transaction
        });

        return updated === 1;
    }

    // Stops an active run and records why it stopped.
    async stopRun(
        id: number,
        reason: VslStopReason,
        transaction?: Transaction
    ): Promise<boolean> {
        const [updated] = await this.model.update({
            status: VslRunStatus.STOPPED,
            stopReason: reason,
            activeCandidateId: null,
            stoppedAt: new Date()
        }, {
            where: { id, status: VslRunStatus.ACTIVE },
            transaction
        });

        return updated === 1;
    }

    // Completes an active run and releases the candidate for future runs.
    async completeRun(
        id: number,
        transaction?: Transaction
    ): Promise<boolean> {
        const [updated] = await this.model.update({
            status: VslRunStatus.COMPLETED,
            activeCandidateId: null,
            completedAt: new Date()
        }, {
            where: { id, status: VslRunStatus.ACTIVE },
            transaction
        });

        return updated === 1;
    }
}

export default new VslRunRepository();