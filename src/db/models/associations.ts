import Candidate from './Candidate.model';
import CandidateAnswer from './CandidateAnswer.model';
import CandidateSubmission from './CandidateSubmission.model';
import FormQuestion from './FormQuestion.model';
import FormQuestionOption from './FormQuestionOption.model';
import FormStep from './FormStep.model';
import QualificationForm from './QualificationForm.model';
import VslRun from './VslRun.model';
import VslStep from './VslStep.model';

function setupAssociations(): void {
    QualificationForm.hasMany(FormStep, {
        foreignKey: 'formId',
        as: 'steps',
    });

    FormStep.belongsTo(QualificationForm, {
        foreignKey: 'formId',
        as: 'form',
    });

    QualificationForm.hasMany(FormQuestion, {
        foreignKey: 'formId',
        as: 'questions',
    });

    FormQuestion.belongsTo(QualificationForm, {
        foreignKey: 'formId',
        as: 'form',
    });

    FormStep.hasMany(FormQuestion, {
        foreignKey: 'stepId',
        as: 'questions',
    });

    FormQuestion.belongsTo(FormStep, {
        foreignKey: 'stepId',
        as: 'step',
    });

    FormQuestion.hasMany(FormQuestionOption, {
        foreignKey: 'questionId',
        as: 'options',
    });

    FormQuestionOption.belongsTo(FormQuestion, {
        foreignKey: 'questionId',
        as: 'question',
    });

    Candidate.hasMany(CandidateSubmission, {
        foreignKey: 'candidateId',
        as: 'submissions',
    });

    CandidateSubmission.belongsTo(Candidate, {
        foreignKey: 'candidateId',
        as: 'candidate',
    });

    QualificationForm.hasMany(CandidateSubmission, {
        foreignKey: 'formId',
        as: 'submissions',
    });

    CandidateSubmission.belongsTo(QualificationForm, {
        foreignKey: 'formId',
        as: 'form',
    });

    CandidateSubmission.hasMany(CandidateAnswer, {
        foreignKey: 'submissionId',
        as: 'answers',
    });

    CandidateAnswer.belongsTo(CandidateSubmission, {
        foreignKey: 'submissionId',
        as: 'submission',
    });

    FormQuestion.hasMany(CandidateAnswer, {
        foreignKey: 'questionId',
        as: 'answers',
    });

    CandidateAnswer.belongsTo(FormQuestion, {
        foreignKey: 'questionId',
        as: 'question',
    });

    FormQuestionOption.hasMany(CandidateAnswer, {
        foreignKey: 'selectedOptionId',
        as: 'answers',
    });

    CandidateAnswer.belongsTo(FormQuestionOption, {
        foreignKey: 'selectedOptionId',
        as: 'selectedOption',
    });

        // A VSL run belongs to one candidate and one submission.
    VslRun.belongsTo(Candidate, {
        foreignKey: 'candidateId',
        as: 'candidate',
    });

    VslRun.belongsTo(CandidateSubmission, {
        foreignKey: 'submissionId',
        as: 'submission',
    });

    // Each VSL run contains its scheduled steps.
    VslRun.hasMany(VslStep, {
        foreignKey: 'runId',
        as: 'steps',
    });

    VslStep.belongsTo(VslRun, {
        foreignKey: 'runId',
        as: 'run',
    });
}

export default setupAssociations;