import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const OPTIONS = [10, 25, 50, 100];

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function PageSizeSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">Sayfa başına</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-16 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)} className="text-xs">
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
