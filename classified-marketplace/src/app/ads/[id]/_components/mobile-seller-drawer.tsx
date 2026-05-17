"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export function MobileSellerDrawer({ sellerName, children }: { sellerName: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out ${
        open ? "translate-y-0" : "translate-y-[calc(100%-3rem)]"
      }`}
    >
      {/* Toggle handle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 h-12 text-sm font-semibold"
        aria-expanded={open}
      >
        {open ? (
          <>Close <ChevronDown className="h-4 w-4" /></>
        ) : (
          <>Contact with {sellerName} <ChevronUp className="h-4 w-4" /></>
        )}
      </button>

      {/* Content */}
      <div className="px-4 pb-5">
        {children}
      </div>
    </div>
  );
}
