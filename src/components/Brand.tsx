import { cn } from "@/lib/utils";

export function QuickBiteLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
        <path
          d="M9 3v6a3 3 0 0 1-6 0V3m3 6v12M15 3v18M15 3c1.5 1 3 2.6 3 5s-1.5 4-3 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function QuickBiteWordmark({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <span className={cn("font-display text-lg font-bold tracking-tight", className)}>
      Quick<span className="text-primary">Bite</span>
    </span>
  );
}
