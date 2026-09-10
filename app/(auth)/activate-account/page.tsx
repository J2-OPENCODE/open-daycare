import {
  activateExistingParent,
  activateNewParent,
} from "@/app/(auth)/activate-account/actions";
import { AccountActivationForm } from "@/components/auth/account-activation-form";
import { InvalidActivation } from "@/components/auth/invalid-activation";
import { WrongSessionNotice } from "@/components/auth/wrong-session-notice";
import { getAuthAccessState } from "@/lib/auth";
import type { AuthAccessState } from "@/lib/auth";
import {
  buildActivationReturnTo,
  findAuthUserEmail,
  resolveActivationContext,
  toActivationInvitation,
  type ActivationContext,
} from "@/lib/invitations";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Activar cuenta | OpenDayCare",
  description: "Activación de cuenta en OpenDayCare.",
  // The URL carries the token, so it must not be indexed or leaked onward.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type ActivateAccountPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readToken(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/** Absent private configuration must not expose an error page to visitors. */
async function loadActivationContext(
  token: string,
): Promise<ActivationContext> {
  try {
    return await resolveActivationContext(
      createAdminClient(),
      token,
      new Date(),
    );
  } catch {
    return { status: "invalid" };
  }
}

/**
 * A signed-in visitor may continue only as the invited parent: same email,
 * `parent` role, active profile and the invitation's own daycare.
 */
async function isInvitedParentSession(
  access: AuthAccessState,
  invitationDaycareId: string,
  invitedEmail: string,
) {
  if (
    access.status !== "active" ||
    access.role !== "parent" ||
    access.daycareId !== invitationDaycareId
  ) {
    return false;
  }

  try {
    return (await findAuthUserEmail(createAdminClient(), access.userId)) ===
      invitedEmail;
  } catch {
    return false;
  }
}

export default async function ActivateAccountPage({
  searchParams,
}: ActivateAccountPageProps) {
  const [access, query] = await Promise.all([
    getAuthAccessState(),
    searchParams,
  ]);
  const token = readToken(query.token);
  const context = await loadActivationContext(token);

  // An accepted invitation is revealed only to the account that accepted it.
  if (context.status === "accepted") {
    if (
      access.status === "active" &&
      access.role === "parent" &&
      access.userId === context.acceptedBy
    ) {
      redirect("/activate-account/success");
    }

    return <ActivationLayout><InvalidActivation /></ActivationLayout>;
  }

  if (context.status === "invalid") {
    return <ActivationLayout><InvalidActivation /></ActivationLayout>;
  }

  const invitation = toActivationInvitation(
    context.invitation,
    context.kidName,
    context.roomName,
  );

  if (access.status === "anonymous") {
    return (
      <ActivationLayout>
        <AccountActivationForm
          invitation={invitation}
          variant="new"
          action={activateNewParent.bind(null, token)}
        />
      </ActivationLayout>
    );
  }

  const isInvitedParent = await isInvitedParentSession(
    access,
    context.invitation.daycare_id,
    context.invitation.email,
  );

  if (!isInvitedParent) {
    return (
      <ActivationLayout>
        <WrongSessionNotice
          returnTo={buildActivationReturnTo(token) ?? "/activate-account"}
        />
      </ActivationLayout>
    );
  }

  return (
    <ActivationLayout>
      <AccountActivationForm
        invitation={invitation}
        variant="existing"
        action={activateExistingParent.bind(null, token)}
      />
    </ActivationLayout>
  );
}

function ActivationLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-auth-background px-5 py-8 md:p-10"
      aria-labelledby="account-activation-heading"
    >
      {children}
    </main>
  );
}
