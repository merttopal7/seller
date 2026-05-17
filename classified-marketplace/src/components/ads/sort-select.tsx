"use client";

import { useRouter } from "next/navigation";

interface SortOption {
  value: string;
  label: string;
  href: string;
}

export function SortSelect({ options, current }: { options: SortOption[]; current: string }) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => {
        const opt = options.find((o) => o.value === e.target.value);
        if (opt) router.push(opt.href);
      }}
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
