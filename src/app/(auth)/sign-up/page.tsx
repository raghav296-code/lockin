"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignUpInput) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUpAction(data);

      if (!result.ok) {
        setError(result.error || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      // Automatically sign in the newly registered user
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Fallback to sign-in page if automatic sign-in had an issue
        router.push("/sign-in");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to sign up with Google.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="border border-border bg-surface/90 backdrop-blur-xl shadow-xl">
      <CardHeader className="text-center space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription className="text-secondary text-[14px]">
          Start building your personal learning hub
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px] flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl flex items-center justify-center gap-3 font-medium text-[14px]"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-secondary" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[12px] uppercase">
            <span className="bg-surface px-2.5 text-muted font-medium">or</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Full name
            </label>
            <Input
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              disabled={isLoading || isGoogleLoading}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[12px] text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Username
            </label>
            <Input
              type="text"
              placeholder="adalovelace"
              autoComplete="username"
              disabled={isLoading || isGoogleLoading}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-[12px] text-danger">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading || isGoogleLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[12px] text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Password (minimum 8 characters)
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading || isGoogleLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[12px] text-danger">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-[15px] font-semibold mt-2"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Create account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-[13px] text-secondary">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-accent hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
