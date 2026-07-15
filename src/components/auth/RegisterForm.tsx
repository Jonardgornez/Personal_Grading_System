"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/protectedAuth";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("password", data.password);

      const response = await registerAction(formData);

      if (!response.success) {
        setServerError(response.error ?? "Registration failed.");
        return;
      }

      reset();
      onSuccess?.();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium animate-pulse">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            First Name
          </label>
          <input
            type="text"
            placeholder="Juan"
            disabled={isPending}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Dela Cruz"
            disabled={isPending}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@university.edu"
          disabled={isPending}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isPending}
            className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 rounded-lg text-sm disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
