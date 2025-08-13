"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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

const formSchema = z.object({
  email: z.string().email({ message: "Alamat email tidak valid." }),
  password: z
    .string()
    .min(6, { message: "Kata sandi minimal harus 6 karakter." }),
});

type AuthFormProps = {
  variant: "login" | "signup";
};

export function AuthForm({ variant }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (variant === "signup") {
        await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        router.push("/quiz");
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        if (values.email === 'admin@screenwise.com') {
          router.push("/");
        } else {
          router.push("/quiz");
        }
      }
    } catch (error: any) {
      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email ini sudah terdaftar. Silakan login.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = "Email atau kata sandi salah.";
      }

      toast({
        variant: "destructive",
        title: "Autentikasi gagal",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {variant === "signup" ? "Buat Akun" : "Masuk"}
        </Button>
      </form>
    </Form>
  );
}
