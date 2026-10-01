import { Transaction } from 'sequelize';
import { validate as isValidUUID } from 'uuid';

import logger from '../configs/logger.config';
import type Candidate from '../db/models/Candidate.model';
import CandidateSubmission from '../db/models/CandidateSubmission.model';
import type QualificationForm from '../db/models/QualificationForm.model';
import sequelize from '../db/models/sequelize';
import { CreateCandidateDto, CreateCandidateSubmissionDto } from '../dtos/Candidate.dto';
import CandidateRepository from '../repositories/Candidate.repository';
import CandidateAnswerRepository from '../repositories/CandidateAnswer.repository';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import FormQuestionOptionRepository from '../repositories/FormQuestionOption.repository';
import QualificationFormRepository from '../repositories/QualificationForm.repository';
import { CreateCandidateResponse, CreateSubmissionResponse, GetCandidateResponse, GetCandidateSubmissionResponse } from '../types/Response.type';
import { CandidateSubmissionStatus } from '../utils/enums/CandidateSubmissionStatus';
import { LeadTemperature } from '../utils/enums/LeadTemperature';
import { BadRequestError, InternalServerError, NotFoundError } from '../utils/errors/app.error';
import { FORM_SCORING_QUESTION_KEYS } from '../utils/factories/scoringQuestionKeysFactory';

class CandidateService {
    private readonly candidateRepository: CandidateRepository;
    private readonly candidateSubmissionRepository: CandidateSubmissionRepository;
    private readonly candidateAnswerRepository: CandidateAnswerRepository;
    private readonly qualificationFormRepository: QualificationFormRepository;
    private readonly formQuestionOptionRepository: FormQuestionOptionRepository;

    constructor(
        candidateRepository: CandidateRepository,
        candidateSubmissionRepository: CandidateSubmissionRepository,
        candidateAnswerRepository: CandidateAnswerRepository,
        qualificationFormRepository: QualificationFormRepository,
        formQuestionOptionRepository: FormQuestionOptionRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.candidateSubmissionRepository = candidateSubmissionRepository;
        this.candidateAnswerRepository = candidateAnswerRepository;
        this.qualificationFormRepository = qualificationFormRepository;
        this.formQuestionOptionRepository = formQuestionOptionRepository;
    }

    async createCandidate(payload: CreateCandidateDto): Promise<CreateCandidateResponse> {
        const form: QualificationForm | null = await this.qualificationFormRepository.findFormIdWithSlug(payload.slug);

        if(!form) {
            throw new NotFoundError(`No resource is found with the slug: ${payload.slug}`);
        }

        const transaction = await sequelize.transaction();
        try {
            let candidate: Candidate | null = await this.candidateRepository.findOne({
                email: payload.email,
                phone: payload.phone
            });

            if(!candidate) {
                candidate = await this.candidateRepository.create({
                    fullName: payload.fullName,
                    email: payload.email,
                    phone: payload.phone
                }, transaction);
            }

            const submission: CandidateSubmission = await this.candidateSubmissionRepository.create({
                candidateId: candidate.id,
                formId: form.id,
                formSlug: payload.slug,
                status: CandidateSubmissionStatus.SUBMISSION_PENDING,
                source: payload.source ?? null,
                landingPage: payload.landingPage ?? null,
                utmSource: payload.utmSource ?? null,
                utmMedium: payload.utmMedium ?? null,
                utmCampaign: payload.utmCampaign ?? null,
                utmContent: payload.utmContent ?? null,
                utmTerm: payload.utmTerm ?? null,
            }, transaction);

            await transaction.commit();

            return {
                candidateId: candidate.public_id,
                submissionId: submission.publicId
            };
        } catch (error) {
            await transaction.rollback();

            logger.error(error);

            throw new InternalServerError('Something went wrong, try again');
        }
    }

    async createCandidateSubmission(submissionId: string, payload: CreateCandidateSubmissionDto): Promise<CreateSubmissionResponse> {
        const submission: CandidateSubmission | null = await this.candidateSubmissionRepository.findById(submissionId);

        if(!submission) {
            throw new NotFoundError(`No candidate details found with id: ${submissionId}`);
        }

        const transaction: Transaction = await sequelize.transaction();
        try {
            const answerRows = payload.answers.map((answer) => ({
                submissionId: submission.id,
                questionId: answer.questionId,
                questionKey: answer.questionKey,
                answerText: answer.answerText ?? null,
                answerJson: answer.answerJson ?? null,
                selectedOptionId: answer.selectedOptionId ?? null
            }));

            await this.candidateAnswerRepository.createBulk(
                answerRows,
                transaction
            );

            const scorableSelectedOptionIds: number[] = this.getScorableSelectedOptionIds(
                submission.formSlug,
                payload.answers
            );

            let leadScore: number | null = null;

            if(scorableSelectedOptionIds.length > 0) {
                const scores: number[] = await this.formQuestionOptionRepository.getAllScoresByOptionId(
                    scorableSelectedOptionIds,
                    transaction
                );

                leadScore = scores.reduce((total, score) => {
                    return total + score;
                }, 0);

            }

            await this.candidateSubmissionRepository.markSubmissionAsCompleted(
                submission.publicId,
                {
                    status: CandidateSubmissionStatus.BOOKING_PENDING,
                    submittedAt: new Date(),
                    leadScore: 
                        leadScore !== null
                            ? Math.min(leadScore, 100)
                            : null,
                    leadTemperature: 
                        leadScore !== null
                            ? this.getLeadTemperature(leadScore)
                            : null
                },
                transaction
            );

            await transaction.commit();

            return {
                submissionId: submission.publicId
            };
        } catch (error) {
            await transaction.rollback();

            logger.error(error);

            throw new InternalServerError('Something went wrong, try again');
        }
    }

    async findCandidate(candidateId: string): Promise<GetCandidateResponse> {
        try {
            const candidate = await this.candidateRepository.findOne({
                public_id: candidateId
            });

            if(!candidate) {
                throw new NotFoundError('No details found please register yourself');
            }

            return {
                id: candidate.id,
                fullName: candidate.fullName,
                email: candidate.email,
                phone: candidate.phone
            };
        } catch (error) {
            logger.error('Candidate Not found', error);

            if(error instanceof NotFoundError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong, try again');
        }
    }

    async findCandidateSubmission(submissionId: string): Promise<GetCandidateSubmissionResponse> {
        try {
            if(!isValidUUID(submissionId)) {
                throw new BadRequestError('Submission Id should be a valid UUID');
            }

            const candidateSubmission = await this.candidateSubmissionRepository.findById(submissionId);

            if(!candidateSubmission) {
                throw new NotFoundError('You have not submitted any qualification form, please submit it first');
            }

            return {
                submissionId: candidateSubmission.publicId,
                candidateId: candidateSubmission.candidateId,
                candidatePublicId: candidateSubmission.candidate!.public_id,
                status: candidateSubmission.status,
            };
        } catch (error) {
            logger.error('Submission api error', error);
            console.log(error);

            if(error instanceof BadRequestError || error instanceof NotFoundError) {
                throw error;
            }

            throw new InternalServerError('Something went wrong, try again');
        }
    }

    private getScorableSelectedOptionIds(formSlug: string, answers: CreateCandidateSubmissionDto['answers']): number[] {
        const scoringQuestionKeys: string[] = FORM_SCORING_QUESTION_KEYS[formSlug];

        if (!scoringQuestionKeys) {
            return [];
        }

        const scoringQuestionKeySet = new Set(scoringQuestionKeys);

        return answers
            .filter((answer) => scoringQuestionKeySet.has(answer.questionKey))
            .map((answer) => answer.selectedOptionId)
            .filter((optionId): optionId is number => typeof optionId === 'number');
    }

    private getLeadTemperature(score: number): LeadTemperature {
        if(score >= 75) {
            return LeadTemperature.HOT;
        }

        if(score >= 50) {
            return LeadTemperature.WARM;
        }

        return LeadTemperature.COLD;
    }
}

export default CandidateService;