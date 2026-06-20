"use client";

import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ title, description }: { title?: string; description?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 lg:px-8 h-20 border-b border-border bg-card/60 sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex-1 min-w-0">
        {title && (
          <h2 className="font-display text-lg lg:text-xl font-bold truncate">{title}</h2>
        )}
        {description && (
          <p className="text-sm text-muted-foreground truncate hidden sm:block">{description}</p>
        )}
      </div>
      <div className="hidden md:block w-72">
        <GlobalSearch />
      </div>
      <ThemeToggle />
    </header>
  );
}
