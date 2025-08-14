
'use server';

/**
 * @fileOverview Menganalisis kinerja kuis untuk mengidentifikasi pola jawaban yang berkorelasi dengan kinerja tinggi.
 *
 * - analyzeQuizPerformance - Menganalisis data kuis dan mengidentifikasi pola.
 * - AnalyzeQuizPerformanceInput - Tipe input untuk fungsi analyzeQuizPerformance.
 * - AnalyzeQuizPerformanceOutput - Tipe kembalian untuk fungsi analyzeQuizPerformance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQuizPerformanceInputSchema = z.object({
  quizName: z.string().describe('Nama kuis yang akan dianalisis.'),
  submissions: z.array(
    z.object({
      userId: z.string().describe('ID pengguna yang mengerjakan kuis.'),
      answers: z.record(z.string(), z.string()).describe('Jawaban yang dikirimkan oleh pengguna.'),
      score: z.number().describe('Skor yang dicapai oleh pengguna pada kuis.'),
    })
  ).describe('Sebuah array pengiriman kuis, termasuk ID pengguna, jawaban, dan skor.'),
  highPerformanceThreshold: z.number().describe('Skor di atas mana pengguna dianggap berkinerja tinggi.'),
});

export type AnalyzeQuizPerformanceInput = z.infer<typeof AnalyzeQuizPerformanceInputSchema>;

const AnalyzeQuizPerformanceOutputSchema = z.object({
  keyInsights: z.string().describe('Wawasan kunci tentang pola jawaban yang berkorelasi dengan kinerja tinggi.'),
  suggestedImprovements: z.string().describe('Saran perbaikan untuk peserta tes berdasarkan analisis pola jawaban.'),
});

export type AnalyzeQuizPerformanceOutput = z.infer<typeof AnalyzeQuizPerformanceOutputSchema>;

export async function analyzeQuizPerformance(input: AnalyzeQuizPerformanceInput): Promise<AnalyzeQuizPerformanceOutput> {
  return analyzeQuizPerformanceFlow(input);
}

const analyzeQuizPerformancePrompt = ai.definePrompt({
  name: 'analyzeQuizPerformancePrompt',
  input: {schema: AnalyzeQuizPerformanceInputSchema},
  output: {schema: AnalyzeQuizPerformanceOutputSchema},
  prompt: `Anda adalah asisten AI yang berspesialisasi dalam menganalisis data kinerja kuis untuk memberikan umpan balik kepada peserta.

  Anda diberikan data dari kuis bernama "{{quizName}}". Tugas Anda adalah menganalisis jawaban dari semua peserta untuk menemukan pola. Fokus utama Anda adalah pada bagaimana peserta berkinerja tinggi (skor di atas {{highPerformanceThreshold}}) menjawab pertanyaan dibandingkan dengan yang lain.

  Berdasarkan analisis Anda, berikan:
  1.  **Wawasan Kunci**: Jelaskan pola atau tren menarik dari jawaban yang Anda temukan. Misalnya, "Sebagian besar peserta berkinerja tinggi menjawab 'X' pada pertanyaan Y" atau "Topik Z tampaknya menjadi tantangan bagi banyak peserta."
  2.  **Saran Perbaikan untuk Peserta**: Berikan saran yang dapat ditindaklanjuti untuk peserta tes. Fokus pada area pengetahuan atau jenis pertanyaan di mana mereka dapat meningkatkan pemahaman mereka. JANGAN menyarankan perubahan pada soal kuis. Contoh: "Untuk meningkatkan skor Anda, fokuslah pada pemahaman konsep A, karena ini adalah area di mana peserta berkinerja tinggi unggul." atau "Perhatikan pertanyaan tentang topik B, karena ini adalah pembeda utama antara skor tinggi dan rendah."

  Pengiriman:
  {{#each submissions}}
  - ID Pengguna: {{this.userId}}
    Jawaban: {{this.answers}}
    Skor: {{this.score}}
  {{/each}}
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
    // Membersihkan pengiriman dan mengubah objek jawaban menjadi string JSON.
    const sanitizedSubmissions = input.submissions.map(submission => ({
      ...submission,
      userId: 'REDACTED',
      answers: JSON.stringify(submission.answers),
    }));

    const {output} = await analyzeQuizPerformancePrompt({
      ...input,
      // @ts-ignore
      submissions: sanitizedSubmissions,
    });
    return output!;
  }
);
