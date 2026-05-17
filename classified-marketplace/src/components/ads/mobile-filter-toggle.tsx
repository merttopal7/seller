"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ArrowUpDown, Check } from "lucide-react";
import Link from "next/link";

interface SortOption {
  value: string;
  label: string;
  href: string;
}

interface MobileFilterToggleProps {
  children: React.ReactNode;
  currentSort: string;
  sortOptions: SortOption[];
}

export function MobileFilterToggle({ children, currentSort, sortOptions }: MobileFilterToggleProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const currentSortLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? "Sort";

  return (
    <>
      {/* ── Fixed bar below navbar — mobile only ── */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border px-3 py-2">
        <div className="flex gap-2">
          {/* Filters & Categories button */}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="truncate">Filters &amp; Categories</span>
          </button>

          {/* Sort button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium whitespace-nowrap"
            >
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
              {currentSortLabel}
            </button>

            {sortOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg min-w-44 py-1 overflow-hidden">
                  {sortOptions.map((opt) => (
                    <Link
                      key={opt.value}
                      href={opt.href}
                      onClick={() => setSortOpen(false)}
                      className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        currentSort === opt.value ? "text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                      {currentSort === opt.value && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Drawer overlay — mobile only ── */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="relative z-10 w-80 max-w-[85vw] bg-background h-full overflow-y-auto flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
              <span className="font-semibold text-sm flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters &amp; Categories
              </span>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-6 flex-1">
              {children}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar — always visible on lg ── */}
      <div className="hidden lg:block space-y-6">
        {children}
      </div>
    </>
  );
}
