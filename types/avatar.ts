export type InitialsAvatar = {
  kind: "initials";
  initials: string;
  background: string;
  foreground: string;
};

export type IconAvatar = {
  kind: "icon";
  icon: "megaphone";
  background: string;
  foreground: string;
};
