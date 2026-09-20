import { cn } from "cn";

export function SaleBadge({
  className,
  compact = false,
  tone = "bright",
}: {
  className?: string;
  compact?: boolean;
  tone?: "bright" | "soft";
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "absolute top-1 left-1 z-10 px-1.5 py-1 text-[10px] font-bold tracking-wide uppercase",
          tone === "soft"
            ? "bg-foreground/10 text-foreground/45"
            : "bg-red-600 text-white",
          className
        )}
      >
        50% off
      </span>
    );
  }

  if (tone === "soft") {
    return (
      <span
        className={cn(
          "absolute top-3 left-3 z-10 flex flex-col",
          className
        )}
      >
        <span className="text-2xl leading-none font-bold tracking-tight text-foreground/40">
          50%
        </span>
        <span className="mt-1 text-[10px] font-bold tracking-[0.24em] text-foreground/30 uppercase">
          off
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "absolute top-3 left-3 z-10 flex flex-col items-center justify-center bg-red-600 px-3 py-2.5 text-white",
        className
      )}
    >
      <span className="text-xl leading-none font-bold tracking-tight">50%</span>
      <span className="mt-1 text-[10px] font-bold tracking-[0.22em] uppercase">
        off
      </span>
    </span>
  );
}
