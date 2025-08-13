
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { quizQuestions } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";

interface Attempt {
  userEmail: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);

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

    if (authLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-4xl font-bold mb-8 font-headline">Dasbor Admin</h1>
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manajemen Soal Kuis</CardTitle>
                        <CardDescription>Tambah, edit, atau hapus soal kuis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>No.</TableHead>
                                   <TableHead>Pertanyaan</TableHead>
                                   <TableHead>Aksi</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {quizQuestions.map((q, i) => (
                                   <TableRow key={q.id}>
                                       <TableCell>{i + 1}</TableCell>
                                       <TableCell>{q.question}</TableCell>
                                       <TableCell>
                                           <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                                           <Button variant="destructive" size="sm">Hapus</Button>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                       <Button className="mt-4">Tambah Soal Baru</Button>
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
                                    <TableHead>Skor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Waktu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.length > 0 ? attempts.map((attempt, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{attempt.userEmail}</TableCell>
                                        <TableCell>{attempt.score.toFixed(0)}%</TableCell>
                                        <TableCell>
                                            <span className={attempt.passed ? "text-green-600" : "text-destructive"}>
                                              {attempt.passed ? 'Lulus' : 'Gagal'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(attempt.timestamp).toLocaleString()}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">Belum ada peserta yang mengerjakan kuis.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
