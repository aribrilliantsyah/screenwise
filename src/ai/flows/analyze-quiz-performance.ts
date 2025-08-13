'use server';

/**
 * @fileOverview Analyzes quiz performance to identify answer patterns correlating with high performance.
 *
 * - analyzeQuizPerformance - Analyzes quiz data and identifies patterns.
 * - AnalyzeQuizPerformanceInput - The input type for analyzeQuizPerformance function.
 * - AnalyzeQuizPerformanceOutput - The return type for analyzeQuizPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQuizPerformanceInputSchema = z.object({
  quizName: z.string().describe('The name of the quiz to analyze.'),
  submissions: z.array(
    z.object({
      userId: z.string().describe('The ID of the user who took the quiz.'),
      answers: z.record(z.string(), z.string()).describe('The answers submitted by the user.'),
      score: z.number().describe('The score achieved by the user on the quiz.'),
    })
  ).describe('An array of quiz submissions, including user ID, answers, and score.'),
  highPerformanceThreshold: z.number().describe('The score above which a user is considered high-performing.'),
});

export type AnalyzeQuizPerformanceInput = z.infer<typeof AnalyzeQuizPerformanceInputSchema>;

const AnalyzeQuizPerformanceOutputSchema = z.object({
  keyInsights: z.string().describe('Key insights into answer patterns correlating with high performance.'),
  suggestedImprovements: z.string().describe('Suggested improvements to the quiz or curriculum based on the analysis.'),
});

export type AnalyzeQuizPerformanceOutput = z.infer<typeof AnalyzeQuizPerformanceOutputSchema>;

export async function analyzeQuizPerformance(input: AnalyzeQuizPerformanceInput): Promise<AnalyzeQuizPerformanceOutput> {
  return analyzeQuizPerformanceFlow(input);
}

const analyzeQuizPerformancePrompt = ai.definePrompt({
  name: 'analyzeQuizPerformancePrompt',
  input: {schema: AnalyzeQuizPerformanceInputSchema},
  output: {schema: AnalyzeQuizPerformanceOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing quiz performance data.

  You are provided with data from a quiz called "{{quizName}}". Each submission includes the user's ID, their answers to the quiz questions, and their final score.

  Your task is to analyze this data to identify any patterns in the answers that correlate with high performance. A user is considered high-performing if their score is above {{highPerformanceThreshold}}.

  Based on your analysis, provide key insights into these answer patterns and suggest improvements to the quiz or curriculum.

  Submissions:
  {{#each submissions}}
  - User ID: {{this.userId}}
    Answers: {{json-stringify this.answers}}
    Score: {{this.score}}
  {{/each}}
  
  Here are some tips for extracting the best signal:
  * Make sure to sanitize the incoming submissions to remove any personally identifiable information.
  * Consider grouping questions by concept to see if high performers consistently do well (or poorly) on specific topics.
  * If all submissions are the same, try setting "highPerformanceThreshold" to a value above that score to induce the LLM to provide the best possible signal.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const analyzeQuizPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeQuizPerformanceFlow',
    inputSchema: AnalyzeQuizPerformanceInputSchema,
    outputSchema: AnalyzeQuizPerformanceOutputSchema,
  },
  async input => {
    // Sanitize the submissions to remove personally identifiable information.
    const sanitizedSubmissions = input.submissions.map(submission => ({
      ...submission,
      userId: 'REDACTED',
    }));

    const {output} = await analyzeQuizPerformancePrompt({
      ...input,
      submissions: sanitizedSubmissions,
    });
    return output!;
  }
);

