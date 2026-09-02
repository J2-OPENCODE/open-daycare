import { MegaphoneIcon } from "@/components/icons";
import type { IconAvatar, InitialsAvatar } from "@/types/avatar";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  avatar: InitialsAvatar | IconAvatar;
  size?: AvatarSize;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-[38px] w-[38px] text-base",
  md: "h-10 w-10 text-base",
  lg: "h-11 w-11 text-[17px]",
  xl: "h-12 w-12 text-[19px]",
};

export function Avatar({ avatar, size = "lg" }: AvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: avatar.background,
        color: avatar.foreground,
      }}
      aria-hidden="true"
    >
      {avatar.kind === "initials" ? (
        avatar.initials
      ) : (
        <MegaphoneIcon size={size === "lg" ? 20 : 18} />
      )}
    </span>
  );
}
