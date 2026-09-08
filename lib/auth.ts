import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";
import { redirect } from "next/navigation";

type UserRole = Database["public"]["Enums"]["user_role"];

export type AuthAccessState =
  | { status: "anonymous" }
  | { status: "inactive" }
  | {
      status: "active";
      userId: string;
      daycareId: string;
      fullName: string;
      role: UserRole;
    };

export async function getAuthAccessState(): Promise<AuthAccessState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return { status: "anonymous" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, daycare_id, full_name, role")
    .eq("id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to verify the active user profile.", {
      cause: profileError,
    });
  }

  return profile
    ? {
        status: "active",
        userId,
        daycareId: profile.daycare_id,
        fullName: profile.full_name,
        role: profile.role,
      }
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

export async function requireKidsAdminUser() {
  const access = await requireActiveUser();

  if (access.role === "parent") {
    redirect("/");
  }

  return access;
}
