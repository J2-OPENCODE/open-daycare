import { CheckIcon } from "@/components/icons";
import type { ReactNode } from "react";

type SuccessNoticeProps = {
  children?: ReactNode;
};

export function SuccessNotice({ children }: SuccessNoticeProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {children ? (
        <div className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-[14px] border border-achievement-strong/20 bg-surface px-4 py-3 text-[14px] font-bold text-foreground shadow-[0_12px_30px_-14px_rgba(63,54,46,0.45)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-achievement-soft text-achievement-strong">
            <CheckIcon size={14} />
          </span>
          {children}
        </div>
      ) : null}
    </div>
  );
}
