import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        primary: "bg-accent text-accent-foreground",
        success: "bg-emerald-100 text-emerald-800 dark:bg-[#102822] dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 dark:bg-[#2c2008] dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-[#2c1010] dark:text-red-300",
        info: "bg-blue-100 text-blue-700 dark:bg-[#0c1f33] dark:text-blue-300",
        outline: "border border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
