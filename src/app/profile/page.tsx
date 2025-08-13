
"use client";

import { useState } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localAuth } from "@/lib/auth";

// Skema untuk pembaruan profil
const profileSchema = z.object({
  name: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  address: z.string().min(1, { message: "Alamat harus diisi." }),
  company: z.string().optional(),
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
    const { user, loading: authLoading, setUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            address: user?.address || "",
            company: user?.company || "",
            whatsapp: user?.whatsapp || "",
            phone: user?.phone || "",
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

    // Efek untuk mereset form jika user berubah (misal setelah login)
    useState(() => {
        if(user) {
            profileForm.reset({
                name: user.name,
                address: user.address,
                company: user.company,
                whatsapp: user.whatsapp,
                phone: user.phone,
            });
        }
    });

    if (authLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null; // Tampilkan null sementara redirect
    }

    const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
        setProfileLoading(true);
        try {
            const updatedUser = localAuth.updateUser(user.email, values);
            if (updatedUser) {
                setUser(updatedUser); // Update state di context
                toast({
                    title: "Profil Diperbarui",
                    description: "Informasi profil Anda berhasil diperbarui.",
                });
            } else {
                 throw new Error("Gagal memperbarui profil.");
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

    const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
        setPasswordLoading(true);
        try {
            const success = localAuth.changePassword(user.email, values.oldPassword, values.newPassword);
            if (success) {
                toast({
                    title: "Kata Sandi Diperbarui",
                    description: "Kata sandi Anda berhasil diubah.",
                });
                passwordForm.reset();
            } else {
                throw new Error("Kata sandi lama Anda salah.");
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
        <div className="container mx-auto max-w-2xl py-10 px-4 space-y-12">
            <div>
                 <h1 className="text-4xl font-bold font-headline">Pengaturan Profil</h1>
                 <p className="text-lg text-muted-foreground">Kelola informasi akun dan kata sandi Anda.</p>
            </div>
            
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
                                    <FormLabel>Nama Lengkap</FormLabel>
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
                                    <FormLabel>Alamat</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Jl. Pahlawan No. 10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="company"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asal Perusahaan (Opsional)</FormLabel>
                                    <FormControl>
                                    <Input placeholder="PT Teknologi Maju" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="whatsapp"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nomor WhatsApp</FormLabel>
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
                                    <FormLabel>Nomor HP</FormLabel>
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
                                    <FormLabel>Kata Sandi Lama</FormLabel>
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
                                    <FormLabel>Kata Sandi Baru</FormLabel>
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
                                    <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
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
    )
}

