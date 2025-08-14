
'use server';

import { prisma } from '@/lib/prisma';
import type { Quiz, Question } from '@prisma/client';

// Re-exporting Quiz type with questions for client-side usage
export type QuizWithQuestions = Quiz & { questions: Question[] };

// Helper function to create a URL-friendly slug from a string
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');


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
    return quizzes;
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
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
      return quiz;
    } catch (error) {
      console.error(`Failed to fetch quiz with id ${id}:`, error);
      return null;
    }
}


export async function createQuiz(data: Omit<QuizWithQuestions, 'id' | 'slug' | 'questions'> & { questions: Omit<Question, 'id' | 'quizId'>[] }): Promise<QuizWithQuestions | null> {
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
                        options: q.options,
                        correctAnswer: q.correctAnswer
                    }))
                }
            },
            include: {
                questions: true
            }
        });
        return newQuiz;
    } catch (error) {
        console.error("Failed to create quiz:", error);
        return null;
    }
}

export async function updateQuiz(quizId: number, data: Omit<QuizWithQuestions, 'id' | 'slug'>): Promise<QuizWithQuestions | null> {
    const { title, description, passingScore, timeLimitSeconds, questions } = data;
    const slug = `${slugify(title)}-${quizId}`; // Keep original ID part for stability

    try {
        // Prisma transaction to update quiz and its questions
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

            // 2. Delete old questions
            await tx.question.deleteMany({
                where: { quizId: quizId }
            });

            // 3. Create new questions
            await tx.question.createMany({
                data: questions.map(q => ({
                    quizId: quizId,
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                }))
            });
            
            // 4. Fetch the final updated quiz with new questions
            const finalQuiz = await tx.quiz.findUnique({
                where: { id: quizId },
                include: { questions: true }
            });

            if (!finalQuiz) {
                throw new Error("Failed to fetch updated quiz.");
            }

            return finalQuiz;
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

// --- User and Attempts Management ---
export interface EnrichedAttempt {
    user: {
        name: string | null;
        email: string;
        phone: string | null;
    };
    quiz: {
        title: string;
    };
    id: number;
    score: number;
    passed: boolean;
    submittedAt: Date;
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
        return attempts;
    } catch (error) {
        console.error("Failed to fetch attempts:", error);
        return [];
    }
}
