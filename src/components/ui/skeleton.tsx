import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
