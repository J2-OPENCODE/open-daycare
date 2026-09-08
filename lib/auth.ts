import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type AuthAccessState =
  | { status: "anonymous" }
  | { status: "inactive" }
  | { status: "active"; userId: string; fullName: string };

export async function getAuthAccessState(): Promise<AuthAccessState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return { status: "anonymous" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to verify the active user profile.", {
      cause: profileError,
    });
  }

  return profile
    ? { status: "active", userId, fullName: profile.full_name }
    : { status: "inactive" };
}

export async function requireActiveUser() {
  const access = await getAuthAccessState();

  if (access.status === "anonymous") {
    redirect("/login");
  }

  if (access.status === "inactive") {
    redirect("/login?reason=inactive");
  }

  return access;
}
