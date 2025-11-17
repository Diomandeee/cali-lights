import { cn } from "./cn";

type PaletteChipProps = {
  hex: string;
  label?: string;
};

export function PaletteChip({ hex, label }: PaletteChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/20 px-2 py-1 text-xs text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      )}
      style={{ backgroundColor: hex }}
    >
      <span className="sr-only">Palette swatch</span>
      <span className="font-semibold uppercase tracking-wide text-black/70">
        {label ?? hex}
      </span>
    </span>
  );
}
