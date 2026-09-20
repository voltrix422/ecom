import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-3 text-4xl">This page is not here</h1>
      <Button asChild className="mt-8 rounded-none">
        <Link href="/">Back to the store</Link>
      </Button>
    </div>
  );
}
