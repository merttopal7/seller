"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  summary?: string;
  defaultOpen?: boolean;
  mobileOnly?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  mobileOnly = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (mobileOnly) {
    return (
      <>
        {/* Mobile: collapsible */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {title}
              {!open && summary && (
                <span className="text-xs font-normal text-primary truncate">
                  {summary}
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && <div className="mt-3">{children}</div>}
        </div>

        {/* Desktop: always open */}
        <div className="hidden lg:block">{children}</div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </>
  );
}
