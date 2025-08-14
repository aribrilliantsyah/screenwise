'use server';

/**
 * @fileOverview A Genkit flow for generating a quiz about ISO 27001:2022.
 *
 * - generateIsoQuiz - Generates a full quiz with questions and answers.
 * - GenerateIsoQuizOutput - The return type for the generateIsoQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {QuizGroup, Question} from '@/data/quiz-data';

const QuestionSchema = z.object({
  id: z.number(),
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of at least 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options.'),
});

const GenerateIsoQuizOutputSchema = z.object({
  id: z.string().default('iso-27001-2022-awareness'),
  title: z.string().default('Kuis Kesadaran ISO 27001:2022'),
  description: z.string().default('Kuis ini menguji pemahaman dasar tentang standar keamanan informasi ISO 27001:2022.'),
  passingScore: z.number().default(70),
  timeLimitSeconds: z.number().default(1800), // 30 menit
  questions: z.array(QuestionSchema).describe('An array of 30 multiple-choice questions.'),
});

export type GenerateIsoQuizOutput = z.infer<typeof GenerateIsoQuizOutputSchema>;


export async function generateIsoQuiz(): Promise<GenerateIsoQuizOutput> {
  return generateIsoQuizFlow();
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateIsoQuizPrompt',
  output: {schema: GenerateIsoQuizOutputSchema},
  prompt: `You are an expert in information security and ISO standards. Your task is to generate a comprehensive quiz about ISO 27001:2022 awareness.

Please generate a complete quiz object that includes:
1.  A title: "Kuis Kesadaran ISO 27001:2022".
2.  A description: "Kuis ini menguji pemahaman dasar tentang standar keamanan informasi ISO 27001:2022."
3.  A passing score of 70.
4.  A time limit of 1800 seconds (30 minutes).
5.  Exactly 30 unique multiple-choice questions.
6.  Each question must have an ID, a question text, at least 4 options, and a correct answer.
7.  The questions should cover a range of topics within ISO 27001:2022, such as its purpose, key clauses (e.g., Annex A controls, risk management, ISMS), benefits, and general concepts.
8.  All questions and options must be in the Indonesian language (Bahasa Indonesia).

Please provide the output in the structured format defined by the output schema.
`,
   config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const generateIsoQuizFlow = ai.defineFlow(
  {
    name: 'generateIsoQuizFlow',
    outputSchema: GenerateIsoQuizOutputSchema,
  },
  async () => {
    const {output} = await generateQuizPrompt();
    return output!;
  }
);
