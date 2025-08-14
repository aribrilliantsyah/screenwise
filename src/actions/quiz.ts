
'use server';

import { Quiz, Question, QuizAttempt, User, sequelize } from '@/lib/db';
import type { Quiz as QuizType, Question as QuestionType, QuizAttempt as QuizAttemptType, User as UserType } from '@/lib/db';
import { Op } from 'sequelize';

// Helper function to create a URL-friendly slug from a string
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// This is the type we'll use on the client-side after parsing the JSON strings
export type QuestionWithOptions = QuestionType & { options: string[] };
export type QuizWithQuestions = QuizType & { questions: QuestionWithOptions[] };
export type AttemptWithAnswers = QuizAttemptType & { answers: Record<string, string> };


// Helper to parse questions from DB format to client format
const parseQuestions = (questions: QuestionType[]): QuestionWithOptions[] => {
    return questions.map(q => ({
        ...q,
        options: JSON.parse(q.options),
    }));
};

const parseQuiz = (quiz: Quiz): QuizWithQuestions => {
    return {
        ...quiz.get({ plain: true }),
        questions: parseQuestions(quiz.questions || []),
    };
};

export async function getQuizzes(): Promise<QuizWithQuestions[]> {
  try {
    const quizzes = await Quiz.findAll({
      include: [{ model: Question, as: 'questions' }],
      order: [['title', 'ASC']],
    });
    return quizzes.map(parseQuiz);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return [];
  }
}

export async function getAllUsers(): Promise<UserType[]> {
    try {
        const users = await User.findAll();
        return users.map(u => u.get({ plain: true }));
    } catch(e) {
        console.error("Failed to fetch users:", e);
        return [];
    }
}


export async function getQuizById(id: number): Promise<QuizWithQuestions | null> {
    try {
      const quiz = await Quiz.findByPk(id, {
        include: [{ model: Question, as: 'questions' }],
      });
      if (!quiz) return null;
      return parseQuiz(quiz);
    } catch (error) {
      console.error(`Failed to fetch quiz with id ${id}:`, error);
      return null;
    }
}

export async function getQuizBySlug(slug: string): Promise<QuizWithQuestions | null> {
    try {
        const quiz = await Quiz.findOne({
            where: { slug },
            include: [{ model: Question, as: 'questions' }],
        });
        if (!quiz) return null;
        return parseQuiz(quiz);
    } catch (error) {
        console.error(`Failed to fetch quiz with slug ${slug}:`, error);
        return null;
    }
}


export async function createQuiz(data: Omit<QuizWithQuestions, 'id' | 'questions' | 'slug'> & { questions: Omit<QuestionWithOptions, 'id' | 'quizId'>[] }): Promise<QuizWithQuestions | null> {
    const { title, description, passingScore, timeLimitSeconds, questions } = data;
    const slug = `${slugify(title)}-${Date.now()}`;
    const t = await sequelize.transaction();
    try {
        const newQuiz = await Quiz.create({
            title,
            slug,
            description,
            passingScore,
            timeLimitSeconds,
        }, { transaction: t });

        const questionData = questions.map(q => ({
            ...q,
            quizId: newQuiz.id,
            options: JSON.stringify(q.options),
        }));

        await Question.bulkCreate(questionData, { transaction: t });
        
        await t.commit();
        
        const result = await getQuizById(newQuiz.id);
        return result;

    } catch (error) {
        await t.rollback();
        console.error("Failed to create quiz:", error);
        return null;
    }
}

export async function updateQuiz(quizId: number, data: Omit<QuizWithQuestions, 'id' | 'slug'>): Promise<QuizWithQuestions | null> {
    const { title, description, passingScore, timeLimitSeconds, questions } = data;
    const slug = `${slugify(title)}-${quizId}`;
    const t = await sequelize.transaction();

    try {
        await Quiz.update({
            title,
            slug,
            description,
            passingScore,
            timeLimitSeconds,
        }, { where: { id: quizId }, transaction: t });

        const questionIdsToKeep = questions.filter(q => q.id).map(q => q.id);
        
        await Question.destroy({
            where: {
                quizId: quizId,
                id: { [Op.notIn]: questionIdsToKeep }
            },
            transaction: t
        });

        for (const q of questions) {
            const questionPayload = {
                quizId: quizId,
                questionText: q.questionText,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer
            };
            if(q.id) {
                await Question.update(questionPayload, { where: { id: q.id }, transaction: t });
            } else {
                await Question.create(questionPayload, { transaction: t });
            }
        }
        
        await t.commit();
        return getQuizById(quizId);

    } catch (error) {
        await t.rollback();
        console.error(`Failed to update quiz ${quizId}:`, error);
        return null;
    }
}

export async function deleteQuiz(quizId: number): Promise<boolean> {
    const t = await sequelize.transaction();
    try {
        await QuizAttempt.destroy({ where: { quizId: quizId }, transaction: t });
        await Question.destroy({ where: { quizId: quizId }, transaction: t });
        await Quiz.destroy({ where: { id: quizId }, transaction: t });
        await t.commit();
        return true;
    } catch (error) {
        await t.rollback();
        console.error(`Failed to delete quiz ${quizId}:`, error);
        return false;
    }
}

export async function saveAttempt(attemptData: Omit<QuizAttemptType, 'id' | 'submittedAt'> & { answers: Record<string, string> }): Promise<QuizAttemptType | null> {
    try {
        const newAttempt = await QuizAttempt.create({
            ...attemptData,
            answers: JSON.stringify(attemptData.answers), // Stringify answers object
        });
        return newAttempt.get({ plain: true });
    } catch (error) {
        console.error("Failed to save attempt:", error);
        return null;
    }
}


// --- User and Attempts Management ---
export interface EnrichedAttempt {
    user: {
        name: string | null;
        email: string;
        phone: string | null;
        address: string | null;
        university: string | null;
        gender: string | null;
        whatsapp: string | null;
    };
    quiz: {
        title: string;
    };
    id: number;
    score: number;
    passed: boolean;
    submittedAt: Date;
    answers: Record<string, string>;
}


export async function getEnrichedAttempts(): Promise<EnrichedAttempt[]> {
    try {
        const attempts = await QuizAttempt.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email', 'phone', 'address', 'university', 'gender', 'whatsapp']
                },
                {
                    model: Quiz,
                    as: 'quiz',
                    attributes: ['title']
                }
            ],
            order: [['submittedAt', 'DESC']]
        });

        // Parse answers string for each attempt
        return attempts.map(attempt => {
            const plainAttempt = attempt.get({ plain: true });
            return {
                ...plainAttempt,
                answers: JSON.parse(plainAttempt.answers),
            } as EnrichedAttempt;
        });

    } catch (error) {
        console.error("Failed to fetch attempts:", error);
        return [];
    }
}

