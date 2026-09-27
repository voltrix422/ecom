import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border-0 font-nav-display whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-black/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-black/85 text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] before:absolute before:inset-x-0 before:bottom-0 before:z-0 before:h-0 before:bg-white before:transition-[height] before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-black hover:before:h-full [&>*]:relative [&>*]:z-10",
        outline:
          "border border-black/20 bg-black/5 text-black shadow-none before:absolute before:inset-x-0 before:bottom-0 before:z-0 before:h-0 before:bg-black before:transition-[height] before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-transparent hover:text-white hover:before:h-full [&>*]:relative [&>*]:z-10",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost:
          "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-5 text-[13px]",
        xs: "h-7 gap-1 rounded-md px-3 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-md px-4 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-1.5 px-7 text-[14px]",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? children : <span>{children}</span>}
    </Comp>
  )
}

export { Button, buttonVariants }
