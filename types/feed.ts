type FeedPostBase = {
  id: string;
  title: string;
  publishedAt: string;
  publishedBy: string;
  audience: string;
  body: string;
  reactions: number;
  comments: number;
  editable: boolean;
};

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

export type PhotoPlaceholder = {
  kind: "photo-placeholder";
  label: string;
};

export type AchievementPost = FeedPostBase & {
  category: "achievement";
  avatar: InitialsAvatar;
  media: null;
};

export type ActivityPost = FeedPostBase & {
  category: "activity";
  avatar: InitialsAvatar;
  media: PhotoPlaceholder;
};

export type AnnouncementPost = FeedPostBase & {
  category: "announcement";
  avatar: IconAvatar;
  media: null;
};

export type FeedPost = AchievementPost | ActivityPost | AnnouncementPost;

export type FeedData = {
  nurseryLabel: string;
  roomName: string;
  greeting: string;
  childCount: number;
  dateLabel: string;
  sectionLabel: string;
  composerPrompt: string;
  currentUser: {
    name: string;
    role: string;
    roomName: string;
    initials: string;
  };
  posts: readonly FeedPost[];
};
