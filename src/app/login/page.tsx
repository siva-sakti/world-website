"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-14">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">world</h1>
      <form action={action} className="space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="email"
          autoComplete="username"
          className="w-full border-b border-neutral-300 bg-transparent py-2 outline-none focus:border-neutral-900"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="password"
          autoComplete="current-password"
          className="w-full border-b border-neutral-300 bg-transparent py-2 outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-sm underline underline-offset-4 hover:no-underline disabled:opacity-50"
        >
          {pending ? "signing in…" : "sign in"}
        </button>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      </form>
    </main>
  );
}
