
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

// Skema untuk langkah 1: Data Diri
const step1Schema = z.object({
  name: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  address: z.string().min(1, { message: "Alamat harus diisi." }),
  company: z.string().optional(),
  gender: z.enum(["Laki-laki", "Perempuan"], { required_error: "Jenis kelamin harus dipilih." }),
  whatsapp: z.string().min(10, { message: "Nomor WhatsApp tidak valid." }),
  phone: z.string().min(10, { message: "Nomor HP tidak valid." }),
});

// Skema untuk langkah 2: Email & Password
const step2Schema = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  password: z.string().min(6, { message: "Kata sandi minimal harus 6 karakter." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
});

// Gabungan skema untuk validasi akhir
const signupSchema = step1Schema.merge(step2Schema);

const loginSchema = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  password: z.string().min(6, { message: "Kata sandi minimal harus 6 karakter." }),
});

type AuthFormProps = {
  variant: "login" | "signup";
};

export function AuthForm({ variant }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const { login, signup } = useAuth();
  
  const formSchema = variant === 'signup' ? signupSchema : loginSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      address: "",
      company: "",
      gender: undefined,
      whatsapp: "",
      phone: "",
    },
  });

  const handleNext = async () => {
    const isValid = await form.trigger(Object.keys(step1Schema.shape) as any);
    if(isValid) {
        setStep(2);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      let success = false;
      if (variant === "signup") {
        success = signup(values as z.infer<typeof signupSchema>);
        if (!success) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
      } else {
        success = login(values.email, values.password);
        if (!success) throw new Error("Email atau kata sandi salah.");
      }
      
      if (success) {
        toast({
            title: variant === 'signup' ? "Pendaftaran Berhasil" : "Login Berhasil",
            description: "Anda akan diarahkan ke dasbor.",
        });
        if (values.email === 'admin@screenwise.com') {
            router.push("/admin");
        } else {
            router.push("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Autentikasi gagal",
        description: error.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'login') {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="nama@contoh.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kata Sandi <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Masuk
                </Button>
            </form>
        </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
            <>
                <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Jenis Kelamin <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                        >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="Laki-laki" />
                            </FormControl>
                            <FormLabel className="font-normal">Laki-laki</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="Perempuan" />
                            </FormControl>
                            <FormLabel className="font-normal">Perempuan</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
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
                    control={form.control}
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
            </>
        )}

        {step === 2 && (
            <>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="nama@contoh.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kata Sandi <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Konfirmasi Kata Sandi <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        )}
        
        <div className="flex gap-2">
            {step === 2 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                    Kembali
                </Button>
            )}

            {step === 1 && (
                 <Button type="button" onClick={handleNext} className="w-full">
                    Selanjutnya
                </Button>
            )}

            {step === 2 && (
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buat Akun
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}

    