import {
  activateExistingParent,
  activateNewParent,
} from "@/app/(auth)/activate-account/actions";
import { AccountActivationForm } from "@/components/auth/account-activation-form";
import { ActivationUnavailable } from "@/components/auth/activation-unavailable";
import { InvalidActivation } from "@/components/auth/invalid-activation";
import { WrongSessionNotice } from "@/components/auth/wrong-session-notice";
import { getAuthAccessState } from "@/lib/auth";
import type { AuthAccessState } from "@/lib/auth";
import {
  buildActivationReturnTo,
  findAuthUserEmail,
  hasAuthAccountForEmail,
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
  const returnTo = buildActivationReturnTo(token);

  // The context is valid only for a well-formed token, so the canonical return
  // always exists here; without it there is no destination worth routing to.
  if (!returnTo) {
    return <ActivationLayout><InvalidActivation /></ActivationLayout>;
  }

  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  if (access.status === "anonymous") {
    // Runs only behind a validated token, so an invalid or expired link can
    // never be used to probe whether an address has an account.
    let hasAccount: boolean;

    try {
      hasAccount = await hasAuthAccountForEmail(
        createAdminClient(),
        context.invitation.email,
      );
    } catch {
      // Failing closed: showing the signup form under doubt is the defect.
      return <ActivationLayout><ActivationUnavailable /></ActivationLayout>;
    }

    // `redirect` throws, so it must run outside the block that catches errors.
    if (hasAccount) {
      redirect(loginHref);
    }

    return (
      <ActivationLayout>
        <AccountActivationForm
          invitation={invitation}
          variant="new"
          action={activateNewParent.bind(null, token)}
          loginHref={loginHref}
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
        <WrongSessionNotice returnTo={returnTo} />
      </ActivationLayout>
    );
  }

  return (
    <ActivationLayout>
      <AccountActivationForm
        invitation={invitation}
        variant="existing"
        action={activateExistingParent.bind(null, token)}
        loginHref={loginHref}
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
