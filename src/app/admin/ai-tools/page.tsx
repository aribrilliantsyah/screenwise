
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { generateQuiz, type GenerateQuizInput } from "@/ai/flows/generate-quiz-flow";
import { getQuizGroups, saveQuizGroups, type QuizGroup } from "@/data/quiz-data";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const quizGenerationSchema = z.object({
  topic: z.string().min(3, "Topik harus memiliki setidaknya 3 karakter."),
  questionCount: z.coerce.number().int().min(1, "Jumlah pertanyaan minimal 1.").max(50, "Jumlah pertanyaan maksimal 50."),
});

type QuizGenerationFormData = z.infer<typeof quizGenerationSchema>;

export default function AiToolsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationSuccess, setGenerationSuccess] = useState(false);

    const form = useForm<QuizGenerationFormData>({
      resolver: zodResolver(quizGenerationSchema),
      defaultValues: {
        topic: "Kesadaran Keamanan ISO 27001:2022",
        questionCount: 30,
      }
    });

    const handleGenerateQuiz = async (values: QuizGenerationFormData) => {
        setIsGenerating(true);
        setGenerationSuccess(false);
        try {
            const generatedQuiz = await generateQuiz(values);
            const currentQuizzes = getQuizGroups();

            // Cek apakah kuis dengan ID yang sama sudah ada
            const quizExists = currentQuizzes.some(q => q.id === generatedQuiz.id);
            if(quizExists) {
                toast({
                    variant: "destructive",
                    title: "Kuis Sudah Ada",
                    description: `Kuis dengan ID "${generatedQuiz.id}" sudah ada. Coba topik lain.`,
                });
                return;
            }

            const updatedQuizzes = [...currentQuizzes, generatedQuiz as QuizGroup];
            saveQuizGroups(updatedQuizzes);
            
            setGenerationSuccess(true);
            toast({
                title: "Kuis Berhasil Dibuat!",
                description: `Kuis "${generatedQuiz.title}" telah ditambahkan ke daftar.`,
            });
            form.reset();

        } catch (error) {
            console.error("Gagal membuat kuis dengan AI:", error);
            toast({
                variant: "destructive",
                title: "Gagal Membuat Kuis",
                description: "Terjadi kesalahan saat berkomunikasi dengan AI. Pastikan API key sudah benar.",
            });
        } finally {
            setIsGenerating(false);
        }
    }
    
    if (authLoading || !isAdmin) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    

    return (
        <div className="container mx-auto max-w-4xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline">Alat Pembuat Kuis AI</h1>
                <p className="text-lg text-muted-foreground">Gunakan AI untuk membuat kuis secara otomatis berdasarkan topik.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit /> Pembuat Kuis Dinamis</CardTitle>
                        <CardDescription>Masukkan topik dan jumlah soal untuk membuat kuis baru secara otomatis menggunakan GenAI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleGenerateQuiz)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="topic"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Topik Kuis</FormLabel>
                                  <FormControl>
                                    <Input placeholder="cth: Kesadaran Phishing" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="questionCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Jumlah Pertanyaan</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={isGenerating}>
                              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isGenerating ? 'Membuat Kuis...' : 'Buat Kuis'}
                            </Button>
                          </form>
                        </Form>

                        {generationSuccess && (
                            <Alert variant="default" className="mt-4 bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Berhasil!</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Kuis baru telah dibuat. Anda bisa melihatnya di <a href="/admin" className="underline font-bold">halaman manajemen kuis</a>.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

            </div>
             <div className="mt-8 text-center">
                <Button variant="link" onClick={() => router.push('/admin')}>
                    &larr; Kembali ke Dasbor Admin
                </Button>
            </div>
        </div>
    );
}
