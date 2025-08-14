
'use server';

/**
 * @fileOverview A Genkit flow for generating a quiz based on a user-provided topic.
 *
 * - generateQuiz - Generates a full quiz with questions and answers.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const QuestionSchema = z.object({
  id: z.number(),
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of at least 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options.'),
});

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz.'),
  questionCount: z.number().int().positive().describe('The number of questions to generate.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;


const GenerateQuizOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  passingScore: z.number().default(70),
  timeLimitSeconds: z.number().default(1800), // 30 menit
  questions: z.array(QuestionSchema),
});

export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert in creating educational content. Your task is to generate a comprehensive quiz about the given topic.

Topic: {{{topic}}}

Please generate a complete quiz object that includes:
1.  A unique ID. This should be a URL-friendly "slug" version of the quiz title (e.g., for "Kuis Kesadaran Phishing", the id would be "kuis-kesadaran-phishing").
2.  A suitable title (e.g., "Kuis Kesadaran {{{topic}}}").
3.  A brief description of the quiz.
4.  A passing score of 70.
5.  A time limit of 1800 seconds (30 minutes).
6.  Exactly {{{questionCount}}} unique multiple-choice questions about the topic.
7.  Each question must have an ID, a question text, at least 4 options, and a correct answer.
8.  All questions, options, title, and description must be in the Indonesian language (Bahasa Indonesia).

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

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const {output} = await generateQuizPrompt(input);
    // Ensure the generated ID is a unique slug
    const slug = output!.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    output!.id = `${slug}-${Date.now()}`;
    return output!;
  }
);
