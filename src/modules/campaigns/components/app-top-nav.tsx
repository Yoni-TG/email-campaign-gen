import Link from "next/link";
import { NavSearch } from "./nav-search";
import { NavTabs } from "./nav-tabs";

// Sticky top chrome shared by the main routes (home, dev catalogs). The
// "theo grace" wordmark sets brand tone via Instrument Serif. Audiences /
// Library / Analytics from the reference design are intentionally omitted
// — we don't have those features and the nav reads cleaner without dead
// tabs. Blocks + Skeletons are dev catalogs but useful enough to surface
// alongside Campaigns at the same level.
export function AppTopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 sm:px-8">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-ink shrink-0"
        >
          theo grace
        </Link>
        <NavTabs />
        <div className="ml-auto flex items-center gap-3">
          <NavSearch />
          <UserMenuPlaceholder />
        </div>
      </div>
    </header>
  );
}

// No auth in this app — the avatar is decorative for now. Initials match
// the brand wordmark so the corner reads as "this is a Theo Grace tool".
function UserMenuPlaceholder() {
  return (
    <span
      aria-hidden
      className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-xs font-semibold uppercase tracking-wider text-surface"
    >
      TG
    </span>
  );
}
