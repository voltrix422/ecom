import { cn } from "cn";

export function FreeShippingStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full shrink-0 justify-center", className)}>
      <p className="animate-free-ship-breathe w-full bg-red-600 px-3 py-0.5 text-center text-[10px] font-semibold leading-none tracking-[0.14em] text-white uppercase">
        Free shipping on all suits
      </p>
    </div>
  );
}
