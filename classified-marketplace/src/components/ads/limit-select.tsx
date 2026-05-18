"use client";

import { useRouter } from "next/navigation";

interface LimitOption {
  value: number;
  href: string;
}

export function LimitSelect({ options, current }: { options: LimitOption[]; current: number }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">Per page</span>
      <select
        value={current}
        onChange={(e) => {
          const opt = options.find((o) => o.value === Number(e.target.value));
          if (opt) router.push(opt.href);
        }}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value}
          </option>
        ))}
      </select>
    </div>
  );
}
