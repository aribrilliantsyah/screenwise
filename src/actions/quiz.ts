
'use server';

import { PrismaClient } from '@prisma/client';
import type { Quiz, Question, QuizAttempt, User } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to create a URL-friendly slug from a string
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// This is the type we'll use on the client-side after parsing the JSON strings
export type QuestionWithOptions = Omit<Question, 'options'> & { options: string[] };
export type QuizWithQuestions = Quiz & { questions: QuestionWithOptions[] };
export type AttemptWithAnswers = Omit<QuizAttempt, 'answers'> & { answers: Record<string, string> };


// Helper to parse questions from DB format to client format
const parseQuestions = (questions: Question[]): QuestionWithOptions[] => {
    return questions.map(q => ({
        ...q,
        options: JSON.parse(q.options),
    }));
};

export async function getQuizzes(): Promise<QuizWithQuestions[]> {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: true,
      },
      orderBy: {
        title: 'asc'
      }
    });
    // Parse the options string for each question
    return quizzes.map(quiz => ({
        ...quiz,
        questions: parseQuestions(quiz.questions),
    }));
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return [];
  }
}

export async function getAllUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany();
        return users;
    } catch(e) {
        console.error("Failed to fetch users:", e);
        return [];
    }
}


export async function getQuizById(id: number): Promise<QuizWithQuestions | null> {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          questions: true,
        },
      });
      if (!quiz) return null;
      return {
          ...quiz,
          questions: parseQuestions(quiz.questions),
      };
    } catch (error) {
      console.error(`Failed to fetch quiz with id ${id}:`, error);
      return null;
    }
}


export async function createQuiz(data: Omit<QuizWithQuestions, 'id' | 'questions'> & { questions: Omit<QuestionWithOptions, 'id' | 'quizId'>[] }): Promise<QuizWithQuestions | null> {
    const { title, description, passingScore, timeLimitSeconds, questions } = data;
    const slug = `${slugify(title)}-${Date.now()}`;

    try {
        const newQuiz = await prisma.quiz.create({
            data: {
                title,
                slug,
                description,
                passingScore,
                timeLimitSeconds,
                questions: {
                    create: questions.map(q => ({
                        questionText: q.questionText,
                        options: JSON.stringify(q.options), // Stringify options
                        correctAnswer: q.correctAnswer
                    }))
                }
            },
            include: {
                questions: true
            }
        });
        return {
            ...newQuiz,
            questions: parseQuestions(newQuiz.questions)
        };
    } catch (error) {
        console.error("Failed to create quiz:", error);
        return null;
    }
}

export async function updateQuiz(quizId: number, data: Omit<QuizWithQuestions, 'id'>): Promise<QuizWithQuestions | null> {
    const { title, description, passingScore, timeLimitSeconds, questions } = data;
    const slug = `${slugify(title)}-${quizId}`; // Keep original ID part for stability

    try {
        const updatedQuiz = await prisma.$transaction(async (tx) => {
            // 1. Update the quiz metadata
            const quiz = await tx.quiz.update({
                where: { id: quizId },
                data: {
                    title,
                    slug,
                    description,
                    passingScore,
                    timeLimitSeconds,
                }
            });

            // 2. Get IDs of existing questions
            const oldQuestions = await tx.question.findMany({
                where: { quizId: quizId },
                select: { id: true }
            });
            const oldQuestionIds = oldQuestions.map(q => q.id);


            // 3. Separate new questions from existing questions to update
            const questionsToCreate = questions.filter(q => !q.id);
            const questionsToUpdate = questions.filter(q => q.id && oldQuestionIds.includes(q.id));
            const questionToUpdateIds = questionsToUpdate.map(q=> q.id as number);

            // 4. Delete questions that are no longer in the list
            const questionsToDeleteIds = oldQuestionIds.filter(id => !questionToUpdateIds.includes(id));
            if (questionsToDeleteIds.length > 0) {
                await tx.question.deleteMany({
                    where: { id: { in: questionsToDeleteIds } }
                });
            }
            
            // 5. Update existing questions
            for (const q of questionsToUpdate) {
                 await tx.question.update({
                    where: { id: q.id },
                    data: {
                        questionText: q.questionText,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer
                    }
                });
            }

            // 6. Create new questions
            if(questionsToCreate.length > 0) {
                await tx.question.createMany({
                    data: questionsToCreate.map(q => ({
                        quizId: quizId,
                        questionText: q.questionText,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer
                    }))
                });
            }
            
            // 7. Fetch the final updated quiz with new questions
            const finalQuiz = await tx.quiz.findUnique({
                where: { id: quizId },
                include: { questions: true }
            });

            if (!finalQuiz) {
                throw new Error("Failed to fetch updated quiz.");
            }

            return {
                ...finalQuiz,
                questions: parseQuestions(finalQuiz.questions),
            }
        });

        return updatedQuiz;
    } catch (error) {
        console.error(`Failed to update quiz ${quizId}:`, error);
        return null;
    }
}

export async function deleteQuiz(quizId: number): Promise<boolean> {
    try {
        // Transaction to delete quiz and its related questions and attempts
        await prisma.$transaction(async (tx) => {
            await tx.quizAttempt.deleteMany({
                where: { quizId: quizId }
            });
            await tx.question.deleteMany({
                where: { quizId: quizId }
            });
            await tx.quiz.delete({
                where: { id: quizId }
            });
        });
        return true;
    } catch (error) {
        console.error(`Failed to delete quiz ${quizId}:`, error);
        return false;
    }
}

export async function saveAttempt(attemptData: Omit<QuizAttempt, 'id' | 'submittedAt' | 'answers'> & { answers: Record<string, string> }): Promise<QuizAttempt | null> {
    try {
        const newAttempt = await prisma.quizAttempt.create({
            data: {
                ...attemptData,
                answers: JSON.stringify(attemptData.answers), // Stringify answers object
            }
        });
        return newAttempt;
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
        const attempts = await prisma.quizAttempt.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                        university: true,
                        gender: true,
                        whatsapp: true,
                    }
                },
                quiz: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });

        // Parse answers string for each attempt
        return attempts.map(attempt => ({
            ...attempt,
            answers: JSON.parse(attempt.answers),
        }));

    } catch (error) {
        console.error("Failed to fetch attempts:", error);
        return [];
    }
}
