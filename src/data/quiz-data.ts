// This file is DEPRECATED and has been replaced by Prisma and server actions.
// Data structures are now defined in `prisma/schema.prisma`.
// Data fetching and mutation is handled in `src/actions/*.ts` files.

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

export interface Submission {
    userId: string;
    quizId: string;
    answers: Record<string, string>;
    score: number;
}


// Mock data for AI analysis, to be replaced by actual DB queries.
export const MOCK_SUBMISSIONS: Submission[] = [
    { userId: "mockuser1", quizId: "pengetahuan-umum-1", answers: { "1": "Paris", "2": "Mars", "3": "Samudra Pasifik" }, score: 100 },
    { userId: "mockuser2", quizId: "pengetahuan-umum-1", answers: { "1": "Paris", "2": "Mars", "3": "Samudra Atlantik" }, score: 67 },
    { userId: "mockuser3", quizId: "pengetahuan-umum-1", answers: { "1": "Berlin", "2": "Mars", "3": "Samudra Pasifik" }, score: 67 },
    { userId: "mockuser4", quizId: "pengetahuan-umum-1", answers: { "1": "Paris", "2": "Jupiter", "3": "Samudra Hindia" }, score: 33 },
    { userId: "mockuser5", quizId: "logika-dasar-1", answers: { "1": "Merah", "2": "32", "3": "9" }, score: 100 },
    { userId: "mockuser6", quizId: "logika-dasar-1", answers: { "1": "Merah", "2": "32", "3": "8" }, score: 67 },
]
