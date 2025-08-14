// This file is deprecated and will be removed in a future update.
// All data fetching is now handled by Prisma through server actions and API routes.

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizGroup {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimitSeconds: number;
}
