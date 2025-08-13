
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Edit, Trash2, FileDown, Upload } from "lucide-react";
import { getQuizGroups, saveQuizGroups, type QuizGroup, type Question } from "@/data/quiz-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as XLSX from "xlsx";

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

type QuizFormData = z.infer<typeof quizFormSchema>;

export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [quizzes, setQuizzes] = useState<QuizGroup[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddQuizDialogOpen, setIsAddQuizDialogOpen] = useState(false);

    // State untuk import
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importedQuiz, setImportedQuiz] = useState<Omit<QuizFormData, 'questions'> & { questions: Omit<Question, 'id'>[] } | null>(null);

    // State untuk paginasi
    const [quizPage, setQuizPage] = useState(1);
    const [attemptsPage, setAttemptsPage] = useState(1);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        setQuizzes(getQuizGroups());
        const allAttemptsRaw = localStorage.getItem('all_quiz_attempts');
        if (allAttemptsRaw) {
            setAttempts(JSON.parse(allAttemptsRaw));
        }
    }, []);

    const form = useForm<QuizFormData>({
        resolver: zodResolver(quizFormSchema),
        defaultValues: {
            title: "",
            description: "",
            passingScore: 70,
            timeLimitSeconds: 300,
            questions: [{ question: "", options: ["", ""], correctAnswer: undefined }]
        },
    });

    const importForm = useForm<QuizFormData>({
        resolver: zodResolver(quizFormSchema),
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const onSubmit = (values: QuizFormData) => {
        setIsSubmitting(true);
        try {
            const newQuiz: QuizGroup = {
                id: values.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
                ...values,
                questions: values.questions.map((q, index) => ({ ...q, id: index + 1 })),
            };

            const updatedQuizzes = [...quizzes, newQuiz];
            saveQuizGroups(updatedQuizzes);
            setQuizzes(updatedQuizzes);
            
            toast({
                title: "Sukses!",
                description: "Kuis baru berhasil ditambahkan.",
            });
            form.reset();
            setIsAddQuizDialogOpen(false);
            
            // Tutup juga dialog impor jika terbuka
            if (isImportDialogOpen) {
                setIsImportDialogOpen(false);
                setImportedQuiz(null);
                importForm.reset();
            }

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

    const handleDownloadTemplate = () => {
        const header = [
            ["Judul Kuis", "Kuis Pengetahuan Dasar"],
            ["Deskripsi", "Uji pengetahuan dasar Anda."],
            ["Skor Lulus (%)", 70],
            ["Batas Waktu (detik)", 300],
            [], // Baris kosong sebagai pemisah
            ['Pertanyaan', 'Opsi 1', 'Opsi 2', 'Opsi 3', 'Opsi 4', 'Opsi 5']
        ];
        const exampleData = [
            ['Apa ibu kota Indonesia?', '(benar)Jakarta', 'Surabaya', 'Bandung'],
            ['Planet apa yang dikenal sebagai Planet Merah?', 'Bumi', '(benar)Mars', 'Jupiter', 'Venus'],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([...header, ...exampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Kuis");
        XLSX.writeFile(workbook, "template_kuis.xlsx");
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (json.length < 6) throw new Error("Format template tidak valid. Pastikan template memiliki header metadata dan pertanyaan.");

                // Ekstrak Metadata
                const title = json[0][1] || `Kuis Impor - ${new Date().toLocaleString()}`;
                const description = json[1][1] || "Deskripsi kuis yang diimpor.";
                const passingScore = parseInt(String(json[2][1]), 10) || 70;
                const timeLimitSeconds = parseInt(String(json[3][1]), 10) || 300;

                // Konversi baris pertanyaan ke objek
                const questionRows = json.slice(5); // Mulai dari baris ke-6
                const questionHeaders = json[5] as string[];

                const parsedQuestions: Omit<Question, 'id'>[] = questionRows.map((row, rowIndex) => {
                    const rowData: { [key: string]: any } = {};
                    questionHeaders.forEach((header, colIndex) => {
                       rowData[header] = row[colIndex];
                    });
                    
                    const question = rowData['Pertanyaan'];
                    if (!question) throw new Error(`Pertanyaan di baris Excel ${rowIndex + 7} kosong.`);
                    
                    const options: string[] = [];
                    let correctAnswer = '';
                    
                    for (let i = 1; i <= 5; i++) {
                        const optionKey = `Opsi ${i}`;
                        let option = rowData[optionKey];
                        if (option) {
                           option = String(option);
                           if (option.startsWith('(benar)')) {
                               const cleanOption = option.replace('(benar)', '').trim();
                               if(correctAnswer) throw new Error(`Pertanyaan di baris Excel ${rowIndex + 7} memiliki lebih dari satu jawaban benar.`);
                               correctAnswer = cleanOption;
                               options.push(cleanOption);
                           } else {
                               options.push(option);
                           }
                        }
                    }

                    if (!correctAnswer) throw new Error(`Tidak ada jawaban benar yang ditandai dengan '(benar)' untuk pertanyaan di baris Excel ${rowIndex + 7}.`);
                    if (options.length < 2) throw new Error(`Pertanyaan di baris Excel ${rowIndex + 7} harus memiliki minimal 2 opsi.`);

                    return { question, options, correctAnswer };
                }).filter(q => q.question); // Filter baris kosong

                if (parsedQuestions.length === 0) {
                   throw new Error("File Excel tidak mengandung pertanyaan atau formatnya salah.");
                }
                
                const tempQuizData = {
                  title,
                  description,
                  passingScore,
                  timeLimitSeconds,
                  questions: parsedQuestions,
                };

                setImportedQuiz(tempQuizData);
                importForm.reset(tempQuizData);
                setIsImportDialogOpen(true);

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Gagal Impor File",
                    description: error.message || "Terjadi kesalahan saat memproses file.",
                });
            } finally {
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsArrayBuffer(file);
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Manajemen Kuis</CardTitle>
                            <CardDescription>Tambah, edit, atau hapus grup soal kuis.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
                             <Button variant="outline" onClick={handleDownloadTemplate}><FileDown /> Unduh Template</Button>
                             <Button onClick={() => fileInputRef.current?.click()}><Upload /> Impor Kuis</Button>
                        </div>
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
                            <Dialog open={isAddQuizDialogOpen} onOpenChange={setIsAddQuizDialogOpen}>
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

            {/* Import Quiz Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Impor Kuis</DialogTitle>
                        <DialogDescription>
                            Tinjau detail kuis yang diimpor di bawah ini. Anda dapat mengubahnya sebelum menyimpan.
                        </DialogDescription>
                    </DialogHeader>
                    {importedQuiz && (
                         <Form {...importForm}>
                             <form onSubmit={importForm.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField name="title" control={importForm.control} render={({ field }) => (
                                    <FormItem><FormLabel>Judul Kuis</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="description" control={importForm.control} render={({ field }) => (
                                    <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField name="passingScore" control={importForm.control} render={({ field }) => (
                                        <FormItem><FormLabel>Skor Lulus (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="timeLimitSeconds" control={importForm.control} render={({ field }) => (
                                        <FormItem><FormLabel>Batas Waktu (detik)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <Card>
                                   <CardHeader><CardTitle>Pertanyaan yang Diimpor ({importedQuiz.questions.length})</CardTitle></CardHeader>
                                   <CardContent className="space-y-4 max-h-60 overflow-y-auto">
                                       {importedQuiz.questions.map((q, index) => (
                                           <div key={index} className="p-3 border rounded-md">
                                               <p className="font-semibold">{index + 1}. {q.question}</p>
                                               <ul className="list-disc pl-5 mt-2 text-sm">
                                                   {q.options.map((opt, optIndex) => (
                                                       <li key={optIndex} className={opt === q.correctAnswer ? 'text-green-600 font-bold' : ''}>
                                                           {opt} {opt === q.correctAnswer && '(Benar)'}
                                                       </li>
                                                   ))}
                                               </ul>
                                           </div>
                                       ))}
                                   </CardContent>
                                </Card>

                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="secondary" onClick={() => setImportedQuiz(null)}>Batal</Button></DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Kuis Impor
                                    </Button>
                                </DialogFooter>
                             </form>
                         </Form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

    