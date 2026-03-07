import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CompletionRecord, TrainingModule } from "@/hooks/useTrainingData";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Link2,
} from "lucide-react";

type Props = {
  module: TrainingModule;
  completion: CompletionRecord | undefined;
  index: number;
  onView: () => void;
};

export default function ModuleCard({
  module,
  completion,
  index,
  onView,
}: Props) {
  const isCompleted = !!completion;

  const formattedDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <Card
      data-ocid={`modules.item.${index}`}
      className="group relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-card-hover"
      style={{
        border: isCompleted
          ? "1.5px solid oklch(0.72 0.14 145 / 40%)"
          : "1.5px solid oklch(var(--border))",
        boxShadow: "0 2px 12px 0 rgba(30, 45, 90, 0.06)",
      }}
      onClick={onView}
    >
      {/* Completed left accent strip */}
      {isCompleted && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
          style={{ background: "oklch(0.72 0.14 145)" }}
        />
      )}

      <CardHeader className="pb-2 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="mt-0.5 p-2 rounded-md shrink-0"
              style={{
                background: isCompleted
                  ? "oklch(0.95 0.05 145)"
                  : "oklch(0.93 0.015 240)",
              }}
            >
              <FileText
                className="w-4 h-4"
                style={{
                  color: isCompleted
                    ? "oklch(0.5 0.12 145)"
                    : "oklch(var(--primary))",
                }}
              />
            </div>
            <div className="min-w-0">
              <h3
                className="font-display font-bold text-base leading-tight truncate"
                style={{ color: "oklch(var(--foreground))" }}
              >
                {module.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CalendarDays
                  className="w-3 h-3"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                />
                <span
                  className="text-xs font-body"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Added {formattedDate(module.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-6">
        <p
          className="text-sm font-body leading-relaxed mb-3 line-clamp-2"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {module.description}
        </p>

        {/* Google Doc attached indicator */}
        {module.googleDocUrl && (
          <div className="flex items-center gap-1.5 mb-3">
            <Link2
              className="w-3.5 h-3.5 shrink-0"
              style={{
                color: isCompleted
                  ? "oklch(0.55 0.1 145)"
                  : "oklch(var(--primary))",
              }}
            />
            <span
              className="text-xs font-body"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Google Doc attached
            </span>
          </div>
        )}

        {/* Completion info or action */}
        {isCompleted ? (
          <div className="flex items-center justify-between">
            <div
              className="text-xs font-body"
              style={{ color: "oklch(0.5 0.08 145)" }}
            >
              Signed by{" "}
              <span className="font-semibold">{completion.userName}</span> on{" "}
              {formattedDate(completion.completedAt)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              data-ocid={`modules.view_button.${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="text-xs font-body gap-1 h-7"
              style={{ color: "oklch(0.5 0.08 145)" }}
            >
              View Record
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              size="sm"
              data-ocid={`modules.view_button.${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="font-display font-semibold gap-1.5"
              style={{ background: "oklch(var(--primary))" }}
            >
              View & Sign
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
