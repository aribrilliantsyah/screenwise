"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Camera } from "lucide-react";
import { login, signup, getAllUniversities } from "@/actions/user";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Combobox } from "./combobox";
import type { SignupData } from "@/actions/user";

// ---------------- Schemas ----------------

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;

const step1Schema = z.object({
  name: z.string().min(1, { message: "Nama lengkap harus diisi." }),
  address: z.string().min(1, { message: "Alamat harus diisi." }),
  university: z.string().optional(),
  gender: z.enum(GENDER_OPTIONS, { required_error: "Jenis kelamin harus dipilih." }),
  whatsapp: z.string().min(10, { message: "Nomor WhatsApp tidak valid." }),
  phone: z.string().min(10, { message: "Nomor HP tidak valid." }),
  photo: z.string().optional(),
});

const step2Schema = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter." }),
  confirmPassword: z.string(),
});

const signupSchema = step1Schema
  .merge(step2Schema)
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter." }),
});

// Semua field digabung (biar FormField name valid untuk login & signup)
type AllFields = {
  // step 1
  name: string;
  address: string;
  university?: string;
  gender?: (typeof GENDER_OPTIONS)[number];
  whatsapp: string;
  phone: string;
  photo?: string;
  // step 2 / login
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFormProps = { variant: "login" | "signup" };

// ---------------- Component ----------------

export function AuthForm({ variant }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [universityOptions, setUniversityOptions] = useState<{ value: string; label: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // schema aktif
  const currentSchema = useMemo(() => {
    if (variant === "login") return loginSchema;
    return step === 1 ? step1Schema : signupSchema;
  }, [variant, step]);

  // cast any untuk redam bentrok tipe schema dinamis
  const resolver = useMemo(() => zodResolver(currentSchema as any) as any, [currentSchema]);

  const form = useForm<AllFields>({
    resolver,
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      // step 1
      name: "",
      address: "",
      university: "",
      gender: undefined,
      whatsapp: "",
      phone: "",
      photo: "",
      // step 2 / login
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isBusy = loading || form.formState.isSubmitting;

  // daftar universitas (kalau Combobox kamu butuh fetch)
  useEffect(() => {
    if (variant !== "signup") return;
    (async () => {
      try {
        const list = await getAllUniversities();
        setUniversityOptions(list.map((u: string) => ({ value: u, label: u })));
      } catch {
        // abaikan error fetch, options kosong tidak apa-apa
      }
    })();
  }, [variant]);

  const handleNext = useCallback(async () => {
    setLoading(true);
    const valid = await form.trigger([
      "name",
      "address",
      "gender",
      "whatsapp",
      "phone",
      "photo",
      "university",
    ]);
    if (valid) setStep(2);
    setLoading(false);
  }, [form]);

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoPreview(dataUri);
        form.setValue("photo", dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    },
    [form]
  );

  const onSubmit = useCallback(
    async (values: any) => {
      setLoading(true);
      try {
        if (variant === "signup") {
          const result = await signup(values as SignupData);
          if (result?.error) throw new Error(result.error);
          toast({ title: "Pendaftaran Berhasil", description: "Mengalihkan ke dasbor..." });
          router.refresh(); // Refresh to re-trigger server-side session check
        } else {
          const result = await login(values.email, values.password);
          if (result?.error) throw new Error(result.error);
          toast({ title: "Login Berhasil", description: "Mengalihkan..." });
          router.refresh(); // Refresh to re-trigger server-side session check
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Autentikasi gagal",
          description: err?.message || "Terjadi kesalahan. Silakan coba lagi.",
        });
      } finally {
        setLoading(false);
      }
    },
    [router, toast, variant]
  );

  // ---------- Render: Login ----------
  if (variant === "login") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          <Button type="submit" className="w-full" disabled={isBusy}>
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
          </Button>
        </form>
      </Form>
    );
  }

  // ---------- Render: Signup ----------
  return (
    <Form {...form}>
      <form key={`${variant}-${step}`} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {step === 1 && (
          <>
            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Foto Profil</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <AvatarImage src={photoPreview || undefined} alt="Pratinjau Foto Profil" />
                        <AvatarFallback>
                          <UserIcon className="h-12 w-12" />
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        aria-label="Unggah foto"
                        tabIndex={0}
                      >
                        <Camera className="h-4 w-4" />
                      </div>
                      <Input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/png, image/jpeg"
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
                    value={field.value ?? ""}
                    onChange={(v: string) => form.setValue("university", v, { shouldValidate: true })}
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
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Laki-laki" /></FormControl>
                        <FormLabel className="font-normal">Laki-laki</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="Perempuan" /></FormControl>
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
                    <Input type="tel" placeholder="081234567890" inputMode="tel" {...field} />
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
                    <Input type="tel" placeholder="081234567890" inputMode="tel" {...field} />
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
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isBusy}>
              Kembali
            </Button>
          )}

          {step === 1 && (
            <Button type="button" onClick={handleNext} className="w-full" disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selanjutnya
            </Button>
          )}

          {step === 2 && (
            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Akun
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
