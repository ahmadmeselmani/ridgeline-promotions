import { Lightbulb } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
  tip,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  // One sentence on how to use the page, for someone seeing it cold.
  tip?: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {tip ? (
        <p className="flex max-w-3xl items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>{tip}</span>
        </p>
      ) : null}
    </div>
  );
}
