"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { useState, Suspense } from "react";

export default function AuthPage() {
  const [view, setView] = useState<"signin" | "register">("signin");

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Welcome</h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your teacher portal
        </p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setView("signin")}
          className={`flex-1 py-2 text-sm rounded-md ${
            view === "signin" ? "bg-white shadow-sm" : "text-slate-500"
          }`}
        >
          Sign In
        </button>

        <button
          onClick={() => setView("register")}
          className={`flex-1 py-2 text-sm rounded-md ${
            view === "register" ? "bg-white shadow-sm" : "text-slate-500"
          }`}
        >
          Register
        </button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        {view === "signin" ? <SignInForm /> : <RegisterForm onSuccess={() => setView("signin")} />}
      </Suspense>
    </div>
  );
}
