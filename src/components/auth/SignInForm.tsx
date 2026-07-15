"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/protectedAuth";
import { Eye, EyeOff } from "lucide-react";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Only allow relative paths to prevent open-redirect attacks
  const raw = searchParams.get("callbackUrl") || "/";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    // Transform plain JSON object into a native standard secure payload stream
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    startTransition(async () => {
      try {
        const result = await loginAction(formData);

        if (!result.success) {
          setServerError(result.error || "Authentication check failed.");
          return;
        }

        // Successfully authenticated -> Route target forward and clear layout cache artifacts
        reset();
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        setServerError("A critical network error occurred. Please try again.");
      }
    });
  };

  // Combine validation submission states with Next.js page routing transitions
  const isFormProcessing = isPending;

  return (
    <form
      className="space-y-4"
      aria-labelledby="signin-title"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 id="signin-title" className="sr-only">
        Sign in form
      </h2>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {serverError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-slate-500 uppercase mb-1"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="teacher@university.edu"
          disabled={isFormProcessing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-slate-500 uppercase mb-1"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isFormProcessing}
            className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isFormProcessing}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFormProcessing ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
