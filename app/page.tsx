import { FeedComposer } from "@/components/feed/feed-composer";
import {
  FeedHeader,
  FeedSectionHeading,
} from "@/components/feed/feed-header";
import { FeedList } from "@/components/feed/feed-list";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { feedData } from "@/data/feed";

export default function Home() {
  return (
    <div className="flex min-h-dvh bg-background md:h-dvh md:overflow-hidden">
      <Sidebar
        roomName={feedData.roomName}
        currentUser={feedData.currentUser}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavigation roomName={feedData.roomName} />

        <main className="min-w-0 flex-1 md:h-full md:overflow-y-auto">
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
        </main>
      </div>
    </div>
  );
}
