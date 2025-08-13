
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { quizGroups } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";

interface Attempt {
  userEmail: string;
  quizId: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

const ITEMS_PER_PAGE = 5;

export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);

    // State untuk paginasi
    const [quizPage, setQuizPage] = useState(1);
    const [attemptsPage, setAttemptsPage] = useState(1);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        // Ambil semua percobaan kuis dari local storage
        const allAttemptsRaw = localStorage.getItem('all_quiz_attempts');
        if (allAttemptsRaw) {
            setAttempts(JSON.parse(allAttemptsRaw));
        }
    }, []);

    // Logika Paginasi Kuis
    const totalQuizPages = Math.ceil(quizGroups.length / ITEMS_PER_PAGE);
    const displayedQuizzes = quizGroups.slice((quizPage - 1) * ITEMS_PER_PAGE, quizPage * ITEMS_PER_PAGE);

    // Logika Paginasi Peserta
    const totalAttemptPages = Math.ceil(attempts.length / ITEMS_PER_PAGE);
    const displayedAttempts = attempts.slice((attemptsPage - 1) * ITEMS_PER_PAGE, attemptsPage * ITEMS_PER_PAGE);


    if (authLoading || !isAdmin) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-4xl font-bold mb-8 font-headline">Dasbor Admin</h1>
            <div className="grid grid-cols-1 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manajemen Kuis</CardTitle>
                        <CardDescription>Tambah, edit, atau hapus grup soal kuis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Nama Kuis</TableHead>
                                   <TableHead>Jumlah Soal</TableHead>
                                   <TableHead>Skor Lulus</TableHead>
                                   <TableHead>Aksi</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {displayedQuizzes.map((group) => (
                                   <TableRow key={group.id}>
                                       <TableCell className="font-medium">{group.title}</TableCell>
                                       <TableCell>{group.questions.length}</TableCell>
                                       <TableCell>{group.passingScore}%</TableCell>
                                       <TableCell>
                                           <Button variant="outline" size="sm" className="mr-2"><Edit /></Button>
                                           <Button variant="destructive" size="sm"><Trash2 /></Button>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                       <div className="flex items-center justify-between mt-4">
                            <Button className="w-fit"><PlusCircle /> Tambah Kuis Baru</Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setQuizPage(prev => Math.max(prev - 1, 1))}
                                    disabled={quizPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm font-medium">
                                    Halaman {quizPage} dari {totalQuizPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setQuizPage(prev => Math.min(prev + 1, totalQuizPages))}
                                    disabled={quizPage === totalQuizPages}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                       </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Monitoring Peserta</CardTitle>
                        <CardDescription>Lihat hasil kuis dari semua peserta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email Peserta</TableHead>
                                    <TableHead>Kuis</TableHead>
                                    <TableHead>Skor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedAttempts.length > 0 ? displayedAttempts.map((attempt, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{attempt.userEmail}</TableCell>
                                        <TableCell>{quizGroups.find(qg => qg.id === attempt.quizId)?.title || 'N/A'}</TableCell>
                                        <TableCell>{attempt.score.toFixed(0)}%</TableCell>
                                        <TableCell>
                                            <span className={attempt.passed ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                                              {attempt.passed ? 'Lulus' : 'Gagal'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">Belum ada peserta yang mengerjakan kuis.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                         <div className="flex items-center justify-end mt-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setAttemptsPage(prev => Math.max(prev - 1, 1))}
                                    disabled={attemptsPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm font-medium">
                                    Halaman {attemptsPage} dari {totalAttemptPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setAttemptsPage(prev => Math.min(prev + 1, totalAttemptPages))}
                                    disabled={attemptsPage === totalAttemptPages || totalAttemptPages === 0}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                       </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
