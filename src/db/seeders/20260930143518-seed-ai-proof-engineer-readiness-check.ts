import { Transaction } from 'sequelize';

import { QuestionType } from '../../utils/enums/QuestionType';
import FormQuestion from '../models/FormQuestion.model';
import FormQuestionOption from '../models/FormQuestionOption.model';
import FormStep from '../models/FormStep.model';
import QualificationForm from '../models/QualificationForm.model';
import sequelize from '../models/sequelize';

const FORM_SLUG = 'ai-fear';

const steps = [
    {
        stepNo: 1,
        title: 'Where are you currently in your engineering career?',
        helperText:
      'This helps us understand your current role and experience level.',
        questions: [
            {
                questionKey: 'company',
                questionText: 'Current Company',
                placeholder: 'Example: TCS, Accenture, Wipro, Startup',
                questionType: QuestionType.TEXT,
                isRequired: true,
                sortOrder: 1,
            },
            {
                questionKey: 'role',
                questionText: 'Current Role',
                placeholder: 'Example: Software Engineer, Backend Developer',
                questionType: QuestionType.TEXT,
                isRequired: true,
                sortOrder: 2,
            },
            {
                questionKey: 'yoe',
                questionText: 'Years of Experience',
                placeholder: 'Select your experience',
                questionType: QuestionType.SELECT,
                isRequired: true,
                sortOrder: 3,
                options: [
                    {
                        optionLabel: '0–1 years',
                        optionValue: '0-1',
                        score: 5,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: '1–2 years',
                        optionValue: '1-2',
                        score: 10,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: '2–4 years',
                        optionValue: '2-4',
                        score: 20,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: '4–7 years',
                        optionValue: '4-7',
                        score: 20,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: '7+ years',
                        optionValue: '7+',
                        score: 15,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 2,
        title:
      'How worried are you about AI affecting your software engineering role?',
        helperText:
      'Choose the option that best describes your current concern.',
        questions: [
            {
                questionKey: 'aiConcern',
                questionText:
          'How worried are you about AI affecting your software engineering role?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel:
              'Very worried — I feel my current work may become replaceable',
                        optionValue: 'very_worried_replaceable',
                        score: 20,
                        sortOrder: 1,
                    },
                    {
                        optionLabel:
              'Somewhat worried — I know I need to upskill',
                        optionValue: 'somewhat_worried_upskill',
                        score: 16,
                        sortOrder: 2,
                    },
                    {
                        optionLabel:
              'Not worried, but I want to stay ahead',
                        optionValue: 'not_worried_stay_ahead',
                        score: 12,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'I am not sure yet',
                        optionValue: 'not_sure_yet',
                        score: 5,
                        sortOrder: 4,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 3,
        title: 'What is your current and target CTC?',
        helperText:
      'This helps us understand your current growth stage.',
        questions: [
            {
                questionKey: 'currentCtc',
                questionText: 'Current CTC',
                placeholder: 'Select current CTC',
                questionType: QuestionType.SELECT,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'Less than ₹5 LPA',
                        optionValue: 'less_than_5_lpa',
                        score: 5,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: '₹5–10 LPA',
                        optionValue: '5-10_lpa',
                        score: 15,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: '₹10–20 LPA',
                        optionValue: '10-20_lpa',
                        score: 20,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: '₹20 LPA+',
                        optionValue: '20_plus_lpa',
                        score: 20,
                        sortOrder: 4,
                    },
                ],
            },

            {
                questionKey: 'targetCtc',
                questionText: 'Target CTC',
                placeholder: 'Select target CTC',
                questionType: QuestionType.SELECT,
                isRequired: true,
                sortOrder: 2,
                options: [
                    {
                        optionLabel: '₹10–20 LPA',
                        optionValue: '10-20_lpa',
                        score: 0,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: '₹20–30 LPA',
                        optionValue: '20-30_lpa',
                        score: 0,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: '₹30–50 LPA',
                        optionValue: '30-50_lpa',
                        score: 0,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: '₹50 LPA+',
                        optionValue: '50_plus_lpa',
                        score: 0,
                        sortOrder: 4,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 4,
        title: 'What do you feel is your biggest gap right now?',
        helperText:
      'For AI-era readiness, this helps us identify where you need the most work.',
        questions: [
            {
                questionKey: 'mainGap',
                questionText:
          'What do you feel is your biggest gap right now?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'AI-assisted engineering skills',
                        optionValue: 'ai_assisted_engineering',
                        score: 0,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'System design and architecture',
                        optionValue: 'system_design_architecture',
                        score: 0,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'DSA and problem solving',
                        optionValue: 'dsa_problem_solving',
                        score: 0,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'Real-world software engineering depth',
                        optionValue: 'real_world_engineering_depth',
                        score: 0,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: 'Interview confidence and communication',
                        optionValue: 'interview_confidence_communication',
                        score: 0,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 5,
        title: 'What best describes your current career situation?',
        helperText:
      'This helps us understand the urgency behind your interest.',
        questions: [
            {
                questionKey: 'careerSituation',
                questionText:
          'What best describes your current career situation?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel:
              'I am worried AI will reduce opportunities',
                        optionValue: 'ai_reduce_opportunities',
                        score: 18,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'My current work feels repetitive',
                        optionValue: 'current_work_repetitive',
                        score: 15,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'I do not know what to learn next',
                        optionValue: 'dont_know_what_to_learn',
                        score: 12,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'I want to switch to better roles',
                        optionValue: 'switch_to_better_roles',
                        score: 18,
                        sortOrder: 4,
                    },
                    {
                        optionLabel:
              'I want to become more valuable in my current company',
                        optionValue: 'more_valuable_current_company',
                        score: 14,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 6,
        title: 'How soon do you want to seriously work on this?',
        helperText:
      'This helps us prioritize serious candidates for strategy calls.',
        questions: [
            {
                questionKey: 'urgency',
                questionText:
          'How soon do you want to seriously work on this?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'Immediately, within 1–2 months',
                        optionValue: 'immediately_1_2_months',
                        score: 20,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'Within 3–6 months',
                        optionValue: 'within_3_6_months',
                        score: 15,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'Within 6–12 months',
                        optionValue: 'within_6_12_months',
                        score: 8,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'Just exploring right now',
                        optionValue: 'just_exploring',
                        score: 0,
                        sortOrder: 4,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 7,
        title:
      'Can you invest in a structured career program if it is the right fit?',
        helperText:
      'The program requires time, effort, and financial commitment.',
        questions: [
            {
                questionKey: 'investmentReadiness',
                questionText:
          'Can you invest in a structured career program if it is the right fit?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel:
              'Yes, I can invest if the program is right for me',
                        optionValue: 'yes_invest',
                        score: 20,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'I would need EMI options',
                        optionValue: 'emi_options',
                        score: 15,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'Not sure yet',
                        optionValue: 'not_sure_yet',
                        score: 5,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'No, I cannot invest right now',
                        optionValue: 'cannot_invest',
                        score: 0,
                        sortOrder: 4,
                    },
                ],
            },

            {
                questionKey: 'notes',
                questionText: 'Anything else we should know?',
                placeholder:
          'Example: I am a backend developer with 3 years of experience, but I feel my current work is repetitive and I am worried about AI...',
                questionType: QuestionType.TEXTAREA,
                isRequired: false,
                sortOrder: 2,
            },
        ],
    },
];

export default {
    async up() {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const [form] = await QualificationForm.findOrCreate({
                where: { slug: FORM_SLUG },
                defaults: {
                    name: 'AI-Proof Engineer Readiness Check',
                    slug: FORM_SLUG,
                    segmentKey: 'ai_fear',
                    title:
            'Let’s check whether your current skillset is strong enough for the AI era.',
                    subTitle: 'AI-Proof Engineer Readiness Check',
                    description:
            'Answer a few questions so our team can understand your current engineering stage, AI-readiness, and whether the AI-Proof Engineer Program is the right fit for you.',
                    version: 1,
                    isActive: true,
                },
                transaction,
            });

            for (const stepData of steps) {
                const [step] = await FormStep.findOrCreate({
                    where: {
                        formId: form.id,
                        stepNo: stepData.stepNo,
                    },
                    defaults: {
                        formId: form.id,
                        stepNo: stepData.stepNo,
                        title: stepData.title,
                        helperText: stepData.helperText,
                        isActive: true,
                    },
                    transaction,
                });

                for (const questionData of stepData.questions) {
                    const [question] = await FormQuestion.findOrCreate({
                        where: {
                            formId: form.id,
                            stepId: step.id,
                            questionKey: questionData.questionKey,
                        },
                        defaults: {
                            formId: form.id,
                            stepId: step.id,
                            questionKey: questionData.questionKey,
                            questionText: questionData.questionText,
                            placeholder: questionData.placeholder,
                            questionType: questionData.questionType,
                            isRequired: questionData.isRequired,
                            sortOrder: questionData.sortOrder,
                            isActive: true,
                        },
                        transaction,
                    });

                    if (questionData.options) {
                        for (const optionData of questionData.options) {
                            await FormQuestionOption.findOrCreate({
                                where: {
                                    questionId: question.id,
                                    optionValue: optionData.optionValue,
                                },
                                defaults: {
                                    questionId: question.id,
                                    optionLabel: optionData.optionLabel,
                                    optionValue: optionData.optionValue,
                                    score: optionData.score,
                                    sortOrder: optionData.sortOrder,
                                    isActive: true,
                                },
                                transaction,
                            });
                        }
                    }
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down() {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const form = await QualificationForm.findOne({
                where: { slug: FORM_SLUG },
                transaction,
            });

            if (form) {
                await form.destroy({ transaction });
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};