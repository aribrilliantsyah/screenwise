
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { getQuizGroups, saveQuizGroups, type QuizGroup } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Attempt {
  userEmail: string;
  quizId: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

const ITEMS_PER_PAGE = 5;

const questionSchema = z.object({
  question: z.string().min(1, "Pertanyaan tidak boleh kosong"),
  options: z.array(z.string().min(1, "Opsi tidak boleh kosong")).min(2, "Minimal 2 opsi"),
  correctAnswer: z.string({ required_error: "Anda harus memilih jawaban yang benar." }).min(1, "Anda harus memilih jawaban yang benar."),
});

const quizFormSchema = z.object({
  title: z.string().min(1, "Judul kuis harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  passingScore: z.coerce.number().min(0).max(100),
  timeLimitSeconds: z.coerce.number().min(60, "Minimal waktu 60 detik"),
  questions: z.array(questionSchema).min(1, "Minimal 1 pertanyaan"),
});


export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [quizzes, setQuizzes] = useState<QuizGroup[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // State untuk paginasi
    const [quizPage, setQuizPage] = useState(1);
    const [attemptsPage, setAttemptsPage] = useState(1);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        // Ambil data dari localStorage
        setQuizzes(getQuizGroups());
        const allAttemptsRaw = localStorage.getItem('all_quiz_attempts');
        if (allAttemptsRaw) {
            setAttempts(JSON.parse(allAttemptsRaw));
        }
    }, []);

    const form = useForm<z.infer<typeof quizFormSchema>>({
        resolver: zodResolver(quizFormSchema),
        defaultValues: {
            title: "",
            description: "",
            passingScore: 70,
            timeLimitSeconds: 300,
            questions: [{ question: "", options: ["", ""], correctAnswer: undefined }]
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const onSubmit = (values: z.infer<typeof quizFormSchema>) => {
        setIsSubmitting(true);
        try {
            const finalValues = {
                ...values,
                questions: values.questions.map(q => ({
                    ...q,
                    options: q.options.filter(opt => opt && opt.trim() !== '') // Hapus opsi kosong
                }))
            };

            const newQuiz: QuizGroup = {
                id: finalValues.title.toLowerCase().replace(/\s+/g, '-'), // Generate ID from title
                ...finalValues,
                questions: finalValues.questions.map((q, index) => ({ ...q, id: index + 1 })),
            };

            const updatedQuizzes = [...quizzes, newQuiz];
            saveQuizGroups(updatedQuizzes);
            setQuizzes(updatedQuizzes);
            
            toast({
                title: "Sukses!",
                description: "Kuis baru berhasil ditambahkan.",
            });
            form.reset();
            setIsDialogOpen(false);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Terjadi kesalahan saat menyimpan kuis.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    // Logika Paginasi Kuis
    const totalQuizPages = Math.ceil(quizzes.length / ITEMS_PER_PAGE);
    const displayedQuizzes = quizzes.slice((quizPage - 1) * ITEMS_PER_PAGE, quizPage * ITEMS_PER_PAGE);

    // Logika Paginasi Peserta
    const totalAttemptPages = Math.ceil(attempts.length / ITEMS_PER_PAGE);
    const displayedAttempts = attempts.slice((attemptsPage - 1) * ITEMS_PER_PAGE, attemptsPage * ITEMS_PER_PAGE);

    // Fungsi untuk menambah dan menghapus opsi jawaban
    const addOption = (questionIndex: number) => {
        const question = form.getValues(`questions.${questionIndex}`);
        update(questionIndex, {
            ...question,
            options: [...question.options, '']
        });
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const question = form.getValues(`questions.${questionIndex}`);
        const newOptions = [...question.options];
        newOptions.splice(optionIndex, 1);
        update(questionIndex, {
            ...question,
            options: newOptions
        });
    };


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
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-fit"><PlusCircle /> Tambah Kuis Baru</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Kuis Baru</DialogTitle>
                                        <DialogDescription>
                                            Isi detail kuis dan tambahkan pertanyaan di bawah ini.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField name="title" control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>Judul Kuis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField name="description" control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField name="passingScore" control={form.control} render={({ field }) => (
                                                    <FormItem><FormLabel>Skor Lulus (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField name="timeLimitSeconds" control={form.control} render={({ field }) => (
                                                    <FormItem><FormLabel>Batas Waktu (detik)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-medium">Pertanyaan</h3>
                                                {fields.map((item, index) => (
                                                    <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                                                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7">
                                                           <Trash2 className="h-4 w-4" />
                                                           <span className="sr-only">Hapus Pertanyaan</span>
                                                        </Button>
                                                        <FormField name={`questions.${index}.question`} control={form.control} render={({ field }) => (
                                                            <FormItem><FormLabel>Pertanyaan {index + 1}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        
                                                        <FormField
                                                          name={`questions.${index}.correctAnswer`}
                                                          control={form.control}
                                                          render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Opsi Jawaban (pilih satu yang benar)</FormLabel>
                                                                <FormControl>
                                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                                                                        {form.watch(`questions.${index}.options`).map((option, optionIndex) => (
                                                                            <div key={optionIndex} className="flex items-center gap-2">
                                                                                <FormControl>
                                                                                    <RadioGroupItem value={form.watch(`questions.${index}.options.${optionIndex}`)} id={`q${index}-o${optionIndex}`} />
                                                                                </FormControl>
                                                                                <Input
                                                                                    {...form.register(`questions.${index}.options.${optionIndex}`)}
                                                                                    placeholder={`Opsi ${optionIndex + 1}`}
                                                                                    className="flex-1"
                                                                                />
                                                                                {form.getValues(`questions.${index}.options`).length > 2 && (
                                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index, optionIndex)}>
                                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                          )}
                                                        />
                                                         <Button type="button" variant="outline" size="sm" onClick={() => addOption(index)}>Tambah Opsi</Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" onClick={() => append({ question: "", options: ["", ""], correctAnswer: undefined })}>Tambah Pertanyaan</Button>
                                            </div>
                                            
                                            <DialogFooter>
                                                <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                                                <Button type="submit" disabled={isSubmitting}>
                                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Simpan Kuis
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>

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
                                    disabled={quizPage === totalQuizPages || totalQuizPages === 0}
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
                                        <TableCell>{quizzes.find(qg => qg.id === attempt.quizId)?.title || 'N/A'}</TableCell>
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
