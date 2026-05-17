"use client";

import { useState, Children } from "react";

interface AdDetailTabsProps {
  labels: string[];
  children: React.ReactNode;
}

export function AdDetailTabs({ labels, children }: AdDetailTabsProps) {
  const [active, setActive] = useState(0);
  const panels = Children.toArray(children);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActive(i)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              active === i
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {active === i && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="p-6">{panels[active]}</div>
    </div>
  );
}
