
"use client";

import { useState, useRef, useEffect } from "react";
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
import { Loader2, User as UserIcon, Camera } from "lucide-react";
import { useAuth, type SignupData } from "@/contexts/auth-context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Combobox } from "./combobox";
import { getAllUniversities } from "@/actions/user";


// Skema untuk langkah 1: Data Diri
const step1Schema = z.object({
  name: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  address: z.string().min(1, { message: "Alamat harus diisi." }),
  university: z.string().optional(),
  gender: z.enum(["Laki-laki", "Perempuan"], { required_error: "Jenis kelamin harus dipilih." }),
  whatsapp: z.string().min(10, { message: "Nomor WhatsApp tidak valid." }),
  phone: z.string().min(10, { message: "Nomor HP tidak valid." }),
  photo: z.string().optional(), // Data URI untuk foto
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
  const { login, signup, getSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [universityOptions, setUniversityOptions] = useState<{ value: string; label: string }[]>([]);

  const currentValidationSchema = variant === 'signup' 
      ? (step === 1 ? step1Schema : step2Schema) 
      : loginSchema;

  const form = useForm({
    resolver: zodResolver(currentValidationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      address: "",
      university: "",
      gender: undefined,
      whatsapp: "",
      phone: "",
      photo: "",
    },
  });

  useEffect(() => {
    async function fetchUniversities() {
      if (variant === 'signup') {
          const storedUniversities = await getAllUniversities();
          setUniversityOptions(storedUniversities.map(u => ({ value: u, label: u })));
      }
    }
    fetchUniversities();
  }, [variant]);


  const handleNext = async () => {
    setLoading(true);
    const isValid = await form.trigger(["name", "address", "gender", "whatsapp", "phone", "photo", "university"]);
    if(isValid) {
        setStep(2);
    }
    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoPreview(dataUri);
        form.setValue("photo", dataUri);
      };
      reader.readAsDataURL(file);
    }
  };


  async function onSubmit(values: z.infer<typeof loginSchema> | z.infer<typeof signupSchema>) {
    setLoading(true);
    try {
      if (variant === "signup") {
        // Gabungkan data dari semua langkah sebelum submit
        const finalData = { ...form.getValues(), ...values } as SignupData;
        const { success, error } = await signup(finalData);
        if (!success) throw new Error(error || "Pendaftaran gagal.");
        
        toast({
            title: "Pendaftaran Berhasil",
            description: "Anda akan diarahkan ke dasbor.",
        });
        router.push("/dashboard");

      } else {
        const { email, password } = values as z.infer<typeof loginSchema>;
        const { success, error } = await login(email, password);
        if (!success) throw new Error(error || "Login gagal.");

        toast({
            title: "Login Berhasil",
            description: "Anda akan diarahkan.",
        });
        const session = getSession();
        router.push(session?.isAdmin ? "/admin" : "/dashboard");
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
                    name="photo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel>Foto Profil</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <AvatarImage src={photoPreview || undefined} alt="Pratinjau Foto Profil"/>
                                <AvatarFallback>
                                    <UserIcon className="h-12 w-12"/>
                                </AvatarFallback>
                            </Avatar>
                            <div 
                              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4"/>
                            </div>
                            <Input 
                              type="file" 
                              className="hidden" 
                              ref={fileInputRef} 
                              onChange={handlePhotoChange} 
                              accept="image/png, image/jpeg, image/jpg" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />

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
                    name="university"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Asal Universitas (Opsional)</FormLabel>
                        <Combobox
                            options={universityOptions}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(value) => form.setValue("university", value)}
                            placeholder="Pilih atau ketik universitas"
                            searchPlaceholder="Cari universitas..."
                            notFoundMessage="Universitas tidak ditemukan."
                        />
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
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" disabled={loading}>
                    Kembali
                </Button>
            )}

            {step === 1 && (
                 <Button type="button" onClick={handleNext} className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
