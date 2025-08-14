
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, FileDown, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { generateIsoQuiz } from "@/ai/flows/generate-quiz-flow";
import { getQuizGroups, saveQuizGroups, type QuizGroup } from "@/data/quiz-data";
import * as XLSX from "xlsx";

interface Attempt {
  userEmail: string;
  quizId: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

export default function AiToolsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationSuccess, setGenerationSuccess] = useState(false);

    const handleGenerateQuiz = async () => {
        setIsGenerating(true);
        setGenerationSuccess(false);
        try {
            const generatedQuiz = await generateIsoQuiz();
            const currentQuizzes = getQuizGroups();

            // Cek apakah kuis dengan ID yang sama sudah ada
            const quizExists = currentQuizzes.some(q => q.id === generatedQuiz.id);
            if(quizExists) {
                toast({
                    variant: "destructive",
                    title: "Kuis Sudah Ada",
                    description: `Kuis dengan ID "${generatedQuiz.id}" sudah ada.`,
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
    
    const handleExportResults = () => {
        try {
            const allAttemptsRaw = localStorage.getItem('all_quiz_attempts');
            const allAttempts: Attempt[] = allAttemptsRaw ? JSON.parse(allAttemptsRaw) : [];

            if (allAttempts.length === 0) {
                toast({
                    title: "Tidak Ada Data",
                    description: "Belum ada peserta yang menyelesaikan kuis.",
                });
                return;
            }

            const allQuizzes = getQuizGroups();
            const quizTitleMap = new Map(allQuizzes.map(q => [q.id, q.title]));

            const dataToExport = allAttempts.map(attempt => ({
                'Email Peserta': attempt.userEmail,
                'Nama Kuis': quizTitleMap.get(attempt.quizId) || attempt.quizId,
                'Skor (%)': attempt.score.toFixed(0),
                'Status': attempt.passed ? 'Lulus' : 'Gagal',
                'Tanggal Pengerjaan': new Date(attempt.timestamp).toLocaleString('id-ID'),
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Peserta");
            XLSX.writeFile(workbook, `hasil_screening_peserta_${new Date().toISOString().split('T')[0]}.xlsx`);

             toast({
                title: "Ekspor Berhasil",
                description: "Data hasil peserta telah diunduh.",
            });

        } catch (error) {
            console.error("Gagal mengekspor data:", error);
            toast({
                variant: "destructive",
                title: "Gagal Ekspor",
                description: "Terjadi kesalahan saat menyiapkan file unduhan.",
            });
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
                <h1 className="text-4xl font-bold font-headline">Alat AI & Ekspor</h1>
                <p className="text-lg text-muted-foreground">Gunakan AI untuk membuat kuis dan ekspor hasil peserta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit /> Pembuat Kuis AI</CardTitle>
                        <CardDescription>Buat kuis baru tentang kesadaran ISO 27001:2022 secara otomatis menggunakan GenAI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Klik tombol di bawah untuk membuat satu set kuis berisi 30 pertanyaan pilihan ganda tentang ISO 27001:2022. Kuis yang dihasilkan akan secara otomatis ditambahkan ke daftar kuis yang tersedia.
                        </p>
                        <Button onClick={handleGenerateQuiz} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isGenerating ? 'Membuat Kuis...' : 'Buat Kuis ISO 27001'}
                        </Button>
                        {generationSuccess && (
                            <Alert variant="default" className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Berhasil!</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Kuis baru telah dibuat. Anda bisa melihatnya di <a href="/admin" className="underline font-bold">halaman manajemen kuis</a>.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileDown /> Ekspor Hasil Peserta</CardTitle>
                        <CardDescription>Unduh semua data hasil pengerjaan kuis dari seluruh peserta dalam format file Excel.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                         <p className="text-sm text-muted-foreground">
                           File Excel akan berisi informasi email peserta, kuis yang dikerjakan, skor, status kelulusan, dan waktu pengerjaan.
                        </p>
                        <Button onClick={handleExportResults} variant="outline">
                            <FileDown className="mr-2 h-4 w-4"/>
                            Ekspor Semua Hasil
                        </Button>
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
