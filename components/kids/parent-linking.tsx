"use client";

import { LinkParentModal } from "@/components/kids/link-parent-modal";
import { LinkedParentsCard } from "@/components/kids/linked-parents-card";
import { SuccessNotice } from "@/components/ui/success-notice";
import type { KidParent } from "@/types/kids";
import { useEffect, useRef, useState } from "react";

type ParentLinkingProps = {
  kidName: string;
  parents: readonly KidParent[];
};

export function ParentLinking({ kidName, parents }: ParentLinkingProps) {
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);
  const [showLinkParentSuccess, setShowLinkParentSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingSuccessRef = useRef(false);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }

  function handleOpenLinkParent() {
    clearSuccessTimer();
    pendingSuccessRef.current = false;
    setShowLinkParentSuccess(false);
    setIsLinkParentOpen(true);
  }

  function handleLinkParentSubmit() {
    pendingSuccessRef.current = true;
    setIsLinkParentOpen(false);
  }

  function handleLinkParentAfterClose() {
    if (!pendingSuccessRef.current) {
      return;
    }

    pendingSuccessRef.current = false;
    setShowLinkParentSuccess(true);
    clearSuccessTimer();
    successTimerRef.current = setTimeout(() => {
      setShowLinkParentSuccess(false);
      successTimerRef.current = null;
    }, 3000);
  }

  return (
    <>
      <LinkedParentsCard
        parents={parents}
        onLinkParent={handleOpenLinkParent}
      />

      <LinkParentModal
        isOpen={isLinkParentOpen}
        kidName={kidName}
        onClose={() => setIsLinkParentOpen(false)}
        onAfterClose={handleLinkParentAfterClose}
        onSubmit={handleLinkParentSubmit}
      />

      <SuccessNotice>
        {showLinkParentSuccess ? "Invitación enviada" : null}
      </SuccessNotice>
    </>
  );
}
