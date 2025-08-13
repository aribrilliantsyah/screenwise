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
  suggestedImprovements: z.string().describe('Saran perbaikan untuk kuis atau kurikulum berdasarkan analisis.'),
});

export type AnalyzeQuizPerformanceOutput = z.infer<typeof AnalyzeQuizPerformanceOutputSchema>;

export async function analyzeQuizPerformance(input: AnalyzeQuizPerformanceInput): Promise<AnalyzeQuizPerformanceOutput> {
  return analyzeQuizPerformanceFlow(input);
}

const analyzeQuizPerformancePrompt = ai.definePrompt({
  name: 'analyzeQuizPerformancePrompt',
  input: {schema: AnalyzeQuizPerformanceInputSchema},
  output: {schema: AnalyzeQuizPerformanceOutputSchema},
  prompt: `Anda adalah asisten AI yang berspesialisasi dalam menganalisis data kinerja kuis.

  Anda diberikan data dari kuis bernama "{{quizName}}". Setiap pengiriman mencakup ID pengguna, jawaban mereka untuk pertanyaan kuis, dan skor akhir mereka.

  Tugas Anda adalah menganalisis data ini untuk mengidentifikasi pola apa pun dalam jawaban yang berkorelasi dengan kinerja tinggi. Pengguna dianggap berkinerja tinggi jika skor mereka di atas {{highPerformanceThreshold}}.

  Berdasarkan analisis Anda, berikan wawasan kunci tentang pola jawaban ini dan sarankan perbaikan untuk kuis atau kurikulum.

  Pengiriman:
  {{#each submissions}}
  - ID Pengguna: {{this.userId}}
    Jawaban: {{json-stringify this.answers}}
    Skor: {{this.score}}
  {{/each}}
  
  Berikut adalah beberapa tips untuk mengekstrak sinyal terbaik:
  * Pastikan untuk membersihkan pengiriman yang masuk untuk menghapus informasi yang dapat diidentifikasi secara pribadi.
  * Pertimbangkan untuk mengelompokkan pertanyaan berdasarkan konsep untuk melihat apakah peserta berkinerja tinggi secara konsisten berhasil (atau gagal) pada topik tertentu.
  * Jika semua pengiriman sama, coba atur "highPerformanceThreshold" ke nilai di atas skor tersebut untuk mendorong LLM memberikan sinyal terbaik.
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
    // Membersihkan pengiriman untuk menghapus informasi yang dapat diidentifikasi secara pribadi.
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
