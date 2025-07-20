import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center space-y-4", className)}
      {...props}
    >
      {/* Pipe Loader */}
      <div className="w-64 h-4 bg-muted rounded-full overflow-hidden relative">
        <div className="absolute h-full bg-primary animate-loading-pipe" />
      </div>

      {/* Text Below */}
      <p className="text-sm text-muted-foreground">Waiting for index to be created</p>
    </div>
  );
}

export { Skeleton };

