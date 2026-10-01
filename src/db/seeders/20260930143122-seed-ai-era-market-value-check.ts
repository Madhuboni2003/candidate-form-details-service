import { Transaction } from 'sequelize';

import { QuestionType } from '../../utils/enums/QuestionType';
import FormQuestion from '../models/FormQuestion.model';
import FormQuestionOption from '../models/FormQuestionOption.model';
import FormStep from '../models/FormStep.model';
import QualificationForm from '../models/QualificationForm.model';
import sequelize from '../models/sequelize';

const FORM_SLUG = 'salary-stagnation';

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
                        score: 8,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: '2–4 years',
                        optionValue: '2-4',
                        score: 18,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: '4–7 years',
                        optionValue: '4-7',
                        score: 22,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: '7+ years',
                        optionValue: '7+',
                        score: 18,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 2,
        title: 'What best describes your current growth situation?',
        helperText:
      'Choose the option closest to your current career stage.',
        questions: [
            {
                questionKey: 'growthSituation',
                questionText:
          'What best describes your current growth situation?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'My salary has not grown meaningfully',
                        optionValue: 'salary_not_grown',
                        score: 20,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'My role has not changed much',
                        optionValue: 'role_not_changed',
                        score: 16,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'I feel behind compared to my peers',
                        optionValue: 'behind_peers',
                        score: 18,
                        sortOrder: 3,
                    },
                    {
                        optionLabel:
              'I want to move to a higher-paying product role',
                        optionValue: 'higher_paying_product',
                        score: 20,
                        sortOrder: 4,
                    },
                    {
                        optionLabel:
              'I want to increase my value before switching',
                        optionValue: 'increase_value_before_switch',
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
        title: 'What do you feel is limiting your market value the most?',
        helperText:
      'This helps us identify which capability gap may be holding back your growth.',
        questions: [
            {
                questionKey: 'mainGap',
                questionText:
          'What do you feel is limiting your market value the most?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel: 'System design and architecture',
                        optionValue: 'system_design_architecture',
                        score: 18,
                        sortOrder: 1,
                    },
                    {
                        optionLabel: 'Product thinking and ownership',
                        optionValue: 'product_thinking_ownership',
                        score: 16,
                        sortOrder: 2,
                    },
                    {
                        optionLabel: 'DSA and problem solving',
                        optionValue: 'dsa_problem_solving',
                        score: 15,
                        sortOrder: 3,
                    },
                    {
                        optionLabel: 'AI-assisted engineering skills',
                        optionValue: 'ai_assisted_engineering',
                        score: 14,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: 'Interview positioning and communication',
                        optionValue: 'interview_positioning',
                        score: 14,
                        sortOrder: 5,
                    },
                    {
                        optionLabel: 'Project depth and proof of skill',
                        optionValue: 'project_depth',
                        score: 14,
                        sortOrder: 6,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 5,
        title: 'What kind of growth are you targeting next?',
        helperText:
      'This helps us understand the direction you want to move toward.',
        questions: [
            {
                questionKey: 'growthTarget',
                questionText:
          'What kind of growth are you targeting next?',
                questionType: QuestionType.RADIO,
                isRequired: true,
                sortOrder: 1,
                options: [
                    {
                        optionLabel:
              'Higher salary in a better software engineering role',
                        optionValue: 'higher_salary_role',
                        score: 16,
                        sortOrder: 1,
                    },
                    {
                        optionLabel:
              'Move from service company to product company',
                        optionValue: 'service_to_product',
                        score: 18,
                        sortOrder: 2,
                    },
                    {
                        optionLabel:
              'Become stronger in system design and senior-level skills',
                        optionValue: 'system_design_senior',
                        score: 16,
                        sortOrder: 3,
                    },
                    {
                        optionLabel:
              'Become more AI-ready and future-proof',
                        optionValue: 'ai_ready',
                        score: 14,
                        sortOrder: 4,
                    },
                    {
                        optionLabel: 'I am not sure yet',
                        optionValue: 'not_sure_yet',
                        score: 4,
                        sortOrder: 5,
                    },
                ],
            },
        ],
    },

    {
        stepNo: 6,
        title: 'How soon do you want to seriously work on your growth?',
        helperText:
      'This helps us prioritize serious candidates for strategy calls.',
        questions: [
            {
                questionKey: 'urgency',
                questionText:
          'How soon do you want to seriously work on your growth?',
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
                        optionLabel:
              'No, I cannot invest right now',
                        optionValue: 'cannot_invest',
                        score: 0,
                        sortOrder: 4,
                    },
                ],
            },

            {
                questionKey: 'notes',
                questionText: 'Anything else you want us to know?',
                placeholder:
          'Example: I have 5 years of experience but my salary has not grown much. I feel stuck and want to move to a better product role...',
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
                    name: 'AI-Era Engineering Value Check',
                    slug: FORM_SLUG,
                    segmentKey: 'salary_stagnation',
                    title:
            'Let’s check what may be limiting your salary, role growth, or market value.',
                    subTitle: 'AI-Era Engineering Value Check',
                    description:
            'Answer a few questions so our team can understand your current growth stage, engineering value gaps, and whether the AI-Proof Engineer Program is the right fit for you.',
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