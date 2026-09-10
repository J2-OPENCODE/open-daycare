"use server";

import { resolveActivationReturnTo } from "@/lib/invitations";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const credentialErrorCodes = new Set([
  "email_not_confirmed",
  "invalid_credentials",
  "user_banned",
]);

type LoginField = "email" | "password";

export type LoginActionState = {
  attempt: number;
  email: string;
  fieldErrors: Partial<Record<LoginField, string>>;
  formError?: string;
};

function failedLogin(
  previousState: LoginActionState,
  email: string,
  options: Pick<LoginActionState, "fieldErrors" | "formError">,
): LoginActionState {
  return {
    attempt: previousState.attempt + 1,
    email,
    fieldErrors: options.fieldErrors,
    formError: options.formError,
  };
}

export async function login(
  previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const fieldErrors: LoginActionState["fieldErrors"] = {};

  if (!emailPattern.test(email)) {
    fieldErrors.email = "Ingresá un correo válido.";
  }

  if (!password) {
    fieldErrors.password = "Ingresá tu contraseña.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return failedLogin(previousState, email, { fieldErrors });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return failedLogin(previousState, email, {
      fieldErrors: {},
      formError: credentialErrorCodes.has(error.code ?? "")
        ? "Correo o contraseña incorrectos."
        : "No pudimos iniciar sesión. Intentá nuevamente.",
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut({ scope: "local" });

    return failedLogin(previousState, email, {
      fieldErrors: {},
      formError: profileError
        ? "No pudimos iniciar sesión. Intentá nuevamente."
        : "Tu cuenta no está activa. Contactá a la guardería.",
    });
  }

  revalidatePath("/", "layout");
  // Re-validated here: the hidden field is untrusted like any other input.
  redirect(resolveActivationReturnTo(formData.get("returnTo")) ?? "/");
}

export async function logout(formData?: FormData) {
  // Only a canonical internal destination survives; anything else is dropped.
  const returnTo = resolveActivationReturnTo(formData?.get("returnTo"));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw new Error("Unable to close the current session.", {
        cause: error,
      });
    }
  }

  revalidatePath("/", "layout");
  redirect(
    returnTo
      ? `/login?returnTo=${encodeURIComponent(returnTo)}`
      : "/login",
  );
}
