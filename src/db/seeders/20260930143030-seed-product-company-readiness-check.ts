import { Transaction } from 'sequelize';

import { QuestionType } from '../../utils/enums/QuestionType';
import FormQuestion from '../models/FormQuestion.model';
import FormQuestionOption from '../models/FormQuestionOption.model';
import FormStep from '../models/FormStep.model';
import QualificationForm from '../models/QualificationForm.model';
import sequelize from '../models/sequelize';

const FORM_SLUG = 'job-switch';

const steps = [
    {
        stepNo: 1,
        title: 'Where are you currently in your engineering career?',
        helperText: 'This helps us understand your current role and experience level.',
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
                        score: 12,
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
        title: 'What best describes your current job-search situation?',
        helperText: 'Choose the option closest to your current situation.',
        questions: [
            {
                questionKey: 'jobSearchSituation',
                questionText: 'What best describes your current job-search situation?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel:
              'I am applying but not getting enough interview calls',
                        optionValue: 'applying_no_calls',
                        score: 20,
                        sortOrder: 1,
                    },
                    {
                        optionLabel:
              'I am getting calls but not clearing interviews',
                        optionValue: 'getting_calls_not_clearing',
                        score: 20,
                        sortOrder: 2,
                    },
                    {
                        optionLabel:
              'I am not sure which companies or roles to target',
                        optionValue: 'unclear_target',
                        score: 12,
                        sortOrder: 3,
                    },
                    {
                        optionLabel:
              'I have not started applying yet but want to switch soon',
                        optionValue: 'not_started',
                        score: 14,
                        sortOrder: 4,
                    },
                    {
                        optionLabel:
              'I am applying randomly without a clear strategy',
                        optionValue: 'random_applying',
                        score: 16,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 3,
        title: 'What is your current and target CTC?',
        helperText:
      'This helps us understand your current value band and growth target.',
        questions: [
            {
                questionKey: 'currentCtc',
                questionText: 'Current CTC',
                placeholder: 'Select your current CTC',
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
                placeholder: 'Select your target CTC',
                questionType: QuestionType.SELECT,
                isRequired: true,
                sortOrder: 2,
                options: [
                    {
                        optionLabel: '₹10–20 LPA',
                        optionValue: '10-20_lpa',
                        score: 5,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: '₹20–30 LPA',
                        optionValue: '20-30_lpa',
                        score: 10,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: '₹30–50 LPA',
                        optionValue: '30-50_lpa',
                        score: 15,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: '₹50 LPA+',
                        optionValue: '50_plus_lpa',
                        score: 20,
                        sortOrder: 4,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 4,
        title: 'What do you feel is your biggest preparation gap?',
        helperText:
      'This helps us identify the capability gap affecting your interviews.',
        questions: [
            {
                questionKey: 'mainGap',
                questionText:
          'What do you feel is your biggest preparation gap?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'DSA',
                        optionValue: 'dsa',
                        score: 15,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'System design',
                        optionValue: 'system_design',
                        score: 16,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'Projects/profile',
                        optionValue: 'projects_profile',
                        score: 14,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'Interview communication',
                        optionValue: 'interview_communication',
                        score: 13,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: 'AI-assisted engineering skills',
                        optionValue: 'ai_assisted_engineering',
                        score: 12,
                        sortOrder: 5,
                    },
                    {
                        optionLabel: 'No clear structure',
                        optionValue: 'no_clear_structure',
                        score: 15,
                        sortOrder: 6,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 5,
        title: 'What type of role are you targeting?',
        helperText:
      'This helps us understand the direction of your job switch.',
        questions: [
            {
                questionKey: 'targetRoleType',
                questionText: 'What type of role are you targeting?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'Product software role',
                        optionValue: 'product_software',
                        score: 12,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'Backend role',
                        optionValue: 'backend',
                        score: 10,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'Fullstack role',
                        optionValue: 'fullstack',
                        score: 10,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'AI-native role',
                        optionValue: 'ai_native',
                        score: 12,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: 'Not sure',
                        optionValue: 'not_sure',
                        score: 4,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 6,
        title: 'How soon do you want to seriously work on your switch?',
        helperText:
      'This helps us prioritize serious candidates for strategy calls.',
        questions: [
            {
                questionKey: 'urgency',
                questionText:
          'How soon do you want to seriously work on your switch?',
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
                        optionLabel: 'Just exploring',
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
                        optionLabel: 'Not sure',
                        optionValue: 'not_sure',
                        score: 5,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'No',
                        optionValue: 'no',
                        score: 0,
                        sortOrder: 4,
                    },
                ],
            },

            {
                questionKey: 'notes',
                questionText: 'Anything else you want us to know?',
                placeholder:
          'Tell us anything about your job-switch situation, goals, or challenges...',
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
                    name: 'Product Company Readiness Check',
                    slug: FORM_SLUG,
                    segmentKey: 'job_switch',
                    title:
            'Let’s check what may be stopping you from getting better interview calls.',
                    subTitle: 'Product Company Readiness Check',
                    description:
            'Answer a few questions so our team can understand your current job-switch situation, preparation gaps, and whether the AI-Proof Engineer Program is the right fit for you.',
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