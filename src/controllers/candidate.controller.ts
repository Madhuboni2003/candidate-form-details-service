import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CreateCandidateDto, CreateCandidateSubmissionDto, CreateSubmissionIdDto, GetCandidateDto, GetSubmissionIdDto } from '../dtos/Candidate.dto';
import CandidateRepository from '../repositories/Candidate.repository';
import CandidateAnswerRepository from '../repositories/CandidateAnswer.repository';
import CandidateSubmissionRepository from '../repositories/CandidateSubmission.repository';
import FormQuestionOptionRepository from '../repositories/FormQuestionOption.repository';
import QualificationFormRepository from '../repositories/QualificationForm.repository';
import CandidateService from '../services/Candidate.service';
import CandidateSubmissionService from '../services/CandidateSubmission.service';
import { CreateCandidateResponse, CreateSubmissionResponse, GetCandidateResponse, GetCandidateSubmissionResponse } from '../types/Response.type';
import { buildSuccessResponse } from '../utils/helpers/response.helper';

const candidateService = new CandidateService(
    new CandidateRepository(),
    new CandidateSubmissionRepository(),
    new CandidateAnswerRepository(),
    new QualificationFormRepository(),
    new FormQuestionOptionRepository()
);

const candidateSubmissionService = new CandidateSubmissionService(
    new CandidateSubmissionRepository()
);

async function createCadidateHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const candidatePayload = req.body as CreateCandidateDto;
        const response: CreateCandidateResponse = await candidateService.createCandidate(candidatePayload);
        res.status(StatusCodes.CREATED).json(
            buildSuccessResponse<CreateCandidateResponse>('Your details is saved successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

async function createCandidateSubmissionHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { submissionId } = req.params as unknown as CreateSubmissionIdDto;
        const submissionPayload = req.body as CreateCandidateSubmissionDto;
        const response: CreateSubmissionResponse = await candidateService.createCandidateSubmission(
            submissionId,
            submissionPayload
        );
        res.status(StatusCodes.CREATED).json(
            buildSuccessResponse<CreateSubmissionResponse>('Your submission is saved successfully, now book your slot for a strategy call', response)
        );
    } catch (error) {
        next(error);
    }
}

async function getCandidateSubmissionHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { submissionId } = req.params as unknown as GetSubmissionIdDto;
        const response = await candidateService.findCandidateSubmission(submissionId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<GetCandidateSubmissionResponse>('Submission details fetched successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

async function getCandidateHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { candidateId } = req.params as unknown as GetCandidateDto;
        const response = await candidateService.findCandidate(candidateId);
        res.status(StatusCodes.OK).json(
            buildSuccessResponse<GetCandidateResponse>('Candidate fetched successfully', response)
        );
    } catch (error) {
        next(error);
    }
}

async function getAllCandidatesWhereBookingPending(_req: Request, res: Response, next: NextFunction) {
    try {
        const response = await candidateSubmissionService.findAllCandidatesWhereBookingPending();
        res.status(StatusCodes.OK).json(
            buildSuccessResponse('Candidate fetched successfully', response)
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
}
async function markSubmissionAsBookedHandler(req: Request,res: Response,next: NextFunction) {
    try {
        const { submissionId } =
            req.params as unknown as GetSubmissionIdDto;

        await candidateSubmissionService.markSubmissionAsBooked(
            submissionId
        );

        res.status(StatusCodes.OK).json(
            buildSuccessResponse(
                'Submission status updated successfully',
                {}
            )
        );
    } catch (error) {
        next(error);
    }
}

export default {
    createCadidateHandler,
    createCandidateSubmissionHandler,
    getCandidateSubmissionHandler,
    getCandidateHandler,
    getAllCandidatesWhereBookingPending,
    markSubmissionAsBookedHandler
};