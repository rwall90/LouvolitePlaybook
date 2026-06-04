"use client";

import { useActionState } from "react";

export function LoginForm({
  action
}: {
  action: (state: { message: string }, formData: FormData) => Promise<{ message: string }>;
}) {
  const [state, formAction, isPending] = useActionState(action, { message: "" });

  return (
    <form className="form" action={formAction}>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Checking..." : "Log in"}
      </button>
      {state.message ? <p className="notice">{state.message}</p> : null}
    </form>
  );
}
