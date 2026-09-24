import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@ridgeline/ui/alert";
import { Skeleton } from "@ridgeline/ui/skeleton";

export function QueryError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Couldn&apos;t load this</AlertTitle>
      <AlertDescription>
        {message}. Is the API running on port 3004? (<code>pnpm dev</code> from the repo root)
      </AlertDescription>
    </Alert>
  );
}

export function LoadingBlock({ className = "h-40" }: { className?: string }) {
  return <Skeleton className={`w-full ${className}`} />;
}
