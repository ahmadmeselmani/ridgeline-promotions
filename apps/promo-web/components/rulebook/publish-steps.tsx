import { Check } from "lucide-react";
import { cn } from "@ridgeline/ui/lib/utils";

const STEPS = [
  { title: "Change a deal", body: "Edit with the pencil, or add a new deal. It only changes your draft." },
  { title: "Check who's affected", body: "Every situation whose price moves is listed below." },
  { title: "Publish", body: "Tills start using the new rules. Until then nothing changes." },
] as const;

export function PublishSteps({ draftDirty }: { draftDirty: boolean }) {
  // Step 1 is done once there's something in the draft; 2 is where you are.
  const current = draftDirty ? 1 : 0;
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.title}
            className={cn(
              "flex gap-3 rounded-lg border p-3",
              active && "border-primary/50 bg-primary/5",
              !active && !done && "opacity-70",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                (active || done) && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
