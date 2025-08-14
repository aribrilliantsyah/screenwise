
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/combobox";
import { getAllUniversities, updateUser, changePassword } from "@/actions/user";
import type { User } from '@/actions/user';
import { useSession } from "@/contexts/session-context";


// Skema untuk pembaruan profil
const profileSchema = z.object({
  name: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  address: z.string().min(1, { message: "Alamat harus diisi." }),
  university: z.string().optional(),
  whatsapp: z.string().min(10, { message: "Nomor WhatsApp tidak valid." }),
  phone: z.string().min(10, { message: "Nomor HP tidak valid." }),
});

// Skema untuk perubahan kata sandi
const passwordSchema = z.object({
    oldPassword: z.string().min(1, { message: "Kata sandi lama harus diisi." }),
    newPassword: z.string().min(6, { message: "Kata sandi baru minimal harus 6 karakter." }),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
});


export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { session, loading: authLoading } = useSession();
    
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [universityOptions, setUniversityOptions] = useState<{ value: string; label: string }[]>([]);

    const user = session?.user;

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            address: "",
            university: "",
            whatsapp: "",
            phone: "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
      async function fetchUniversities() {
        const storedUniversities = await getAllUniversities();
        setUniversityOptions(storedUniversities.map(u => ({ value: u, label: u })));
      }
      fetchUniversities();
    }, []);

    // Efek untuk mereset form jika user berubah (misal setelah login)
    useEffect(() => {
        if(user) {
            profileForm.reset({
                name: user.name || "",
                address: user.address || "",
                university: user.university || "",
                whatsapp: user.whatsapp || "",
                phone: user.phone || "",
            });
        }
    }, [user, profileForm]);

    if (authLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }


    const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
        if(!user) return;
        setProfileLoading(true);
        try {
            const { user: updatedUser, error } = await updateUser(user.id, values as Partial<User>);
            if (updatedUser) {
                // The session provider will automatically update the session state upon re-render or navigation
                toast({
                    title: "Profil Diperbarui",
                    description: "Informasi profil Anda berhasil diperbarui. Silakan muat ulang halaman jika perubahan tidak langsung terlihat.",
                });
            } else {
                 throw new Error(error || "Gagal memperbarui profil.");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error.message || "Terjadi kesalahan.",
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        if(!user) return;
        setPasswordLoading(true);
        try {
            const { success, error } = await changePassword(user.id, values.oldPassword, values.newPassword);
            if (success) {
                toast({
                    title: "Kata Sandi Diperbarui",
                    description: "Kata sandi Anda berhasil diubah.",
                });
                passwordForm.reset();
            } else {
                throw new Error(error || "Gagal mengubah kata sandi.");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error.message || "Terjadi kesalahan.",
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl py-10 px-4">
            <div className="mb-12">
                 <h1 className="text-4xl font-bold font-headline">Pengaturan Profil</h1>
                 <p className="text-lg text-muted-foreground">Kelola informasi akun dan kata sandi Anda.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Profil</CardTitle>
                        <CardDescription>Perbarui data pribadi Anda. Email tidak dapat diubah.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Lengkap <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="address"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alamat <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input placeholder="Jl. Pahlawan No. 10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="university"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Asal Universitas (Opsional)</FormLabel>
                                        <Combobox
                                            options={universityOptions}
                                            {...field}
                                            value={field.value || ""}
                                            onChange={(value) => profileForm.setValue("university", value)}
                                            placeholder="Pilih atau ketik universitas"
                                            searchPlaceholder="Cari universitas..."
                                            notFoundMessage="Universitas tidak ditemukan."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="whatsapp"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor WhatsApp <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input type="tel" placeholder="081234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor HP <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input type="tel" placeholder="081234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={profileLoading}>
                                    {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ubah Kata Sandi</CardTitle>
                        <CardDescription>Pastikan Anda menggunakan kata sandi yang kuat.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="oldPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kata Sandi Lama <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kata Sandi Baru <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Konfirmasi Kata Sandi Baru <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={passwordLoading}>
                                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ubah Kata Sandi
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
