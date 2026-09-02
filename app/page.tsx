import { FeedComposer } from "@/components/feed/feed-composer";
import {
  FeedHeader,
  FeedSectionHeading,
} from "@/components/feed/feed-header";
import { FeedList } from "@/components/feed/feed-list";
import { AppShell } from "@/components/layout/app-shell";
import { feedData } from "@/data/feed";

export default function Home() {
  return (
    <AppShell
      roomName={feedData.roomName}
      currentUser={feedData.currentUser}
      currentDestination="feed"
    >
      <div className="mx-auto w-full max-w-[760px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:pt-[34px] md:pb-20">
        <FeedHeader
          nurseryLabel={feedData.nurseryLabel}
          roomName={feedData.roomName}
          greeting={feedData.greeting}
          childCount={feedData.childCount}
          dateLabel={feedData.dateLabel}
        />
        <FeedComposer
          initials={feedData.currentUser.initials}
          prompt={feedData.composerPrompt}
        />
        <FeedSectionHeading>{feedData.sectionLabel}</FeedSectionHeading>
        <FeedList posts={feedData.posts} />
      </div>
    </AppShell>
  );
}
