import type { IconAvatar, InitialsAvatar } from "@/types/avatar";
import type { Database } from "@/types/database";

export type FeedPostCategory = Database["public"]["Enums"]["post_type"];

export type FeedPostPhoto = {
  kind: "photo";
  url: string;
  additionalPhotoCount: number;
};

export type FeedPost = {
  id: string;
  category: FeedPostCategory;
  title: string;
  publishedAt: string;
  publishedBy: string;
  audience: string;
  body: string;
  reactions: number;
  comments: number;
  editable: boolean;
  avatar: InitialsAvatar | IconAvatar;
  media: FeedPostPhoto | null;
};

export type FeedData = {
  nurseryLabel: string;
  roomName: string;
  greeting: string;
  sectionLabel: string;
  composerPrompt: string;
  currentUser: {
    name: string;
    role: string;
    roomName: string;
    initials: string;
  };
};
