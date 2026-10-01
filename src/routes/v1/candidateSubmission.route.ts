import { Router } from 'express';

import candidateController from '../../controllers/candidate.controller';
import { validateRequestBody, validateRequestParams } from '../../validators';
import { createCandidateSubmissionParamsSchema, createCandidateSubmissionSchema, getCandidateSubmissionParamsSchema } from '../../validators/candidate.validator';

const submissionRouter = Router();

submissionRouter.get(
    '/pending-submissions',
    candidateController.getAllCandidatesWhereBookingPending
);

submissionRouter.put(
    '/:submissionId',
    validateRequestParams(createCandidateSubmissionParamsSchema),
    validateRequestBody(createCandidateSubmissionSchema),
    candidateController.createCandidateSubmissionHandler
);

submissionRouter.put(
    '/:submissionId/book',
    validateRequestParams(getCandidateSubmissionParamsSchema),
    candidateController.markSubmissionAsBookedHandler
);

submissionRouter.get(
    '/:submissionId',
    validateRequestParams(getCandidateSubmissionParamsSchema),
    candidateController.getCandidateSubmissionHandler
);


export default submissionRouter;