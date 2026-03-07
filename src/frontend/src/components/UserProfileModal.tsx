import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
} from "@/hooks/useTrainingData";
import {
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  modules: TrainingModule[];
  assignedModuleIds: string[];
  completions: CompletionRecord[];
  onSave: (userId: string, moduleIds: string[]) => void;
};

export default function UserProfileModal({
  open,
  onOpenChange,
  user,
  modules,
  assignedModuleIds,
  completions,
  onSave,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Sync selected IDs when the active user or their assigned modules change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: user?.id intentionally re-syncs when active user switches
  useEffect(() => {
    setSelectedIds(new Set(assignedModuleIds));
  }, [assignedModuleIds, user?.id]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const toggleModule = (moduleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onSave(user.id, Array.from(selectedIds));
    toast.success(`Assignments updated for ${user.name}.`);
    setIsSaving(false);
    onOpenChange(false);
  };

  const isCompleted = (moduleId: string) =>
    completions.some((c) => c.moduleId === moduleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="admin.user_profile.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-base"
              style={{
                background: "oklch(0.55 0.12 255)",
                color: "oklch(0.95 0.01 240)",
              }}
            >
              {initials}
            </div>
            <div>
              <DialogTitle className="font-display font-bold text-lg leading-tight">
                {user.name}
              </DialogTitle>
              <DialogDescription className="font-body text-sm mt-0.5 sr-only">
                User profile and module assignment for {user.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Profile info */}
        <div
          className="grid grid-cols-3 gap-3 rounded-lg px-4 py-3"
          style={{ background: "oklch(var(--secondary))" }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <User
                className="w-3 h-3 shrink-0"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <span
                className="text-xs font-body uppercase tracking-wider font-semibold"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Name
              </span>
            </div>
            <span
              className="text-sm font-body font-medium truncate"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {user.name}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Briefcase
                className="w-3 h-3 shrink-0"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <span
                className="text-xs font-body uppercase tracking-wider font-semibold"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Role
              </span>
            </div>
            <span
              className="text-sm font-body font-medium truncate"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {user.role || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Building2
                className="w-3 h-3 shrink-0"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <span
                className="text-xs font-body uppercase tracking-wider font-semibold"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Dept
              </span>
            </div>
            <span
              className="text-sm font-body font-medium truncate"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {user.department || "—"}
            </span>
          </div>
        </div>

        <Separator style={{ background: "oklch(var(--border))" }} />

        {/* Module assignment section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="font-display font-semibold text-sm"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Assign Training Modules
              </span>
            </div>
            <Badge variant="secondary" className="font-body text-xs">
              {selectedIds.size} selected
            </Badge>
          </div>

          {modules.length === 0 ? (
            <div
              className="py-8 text-center rounded-lg"
              style={{
                background: "oklch(var(--secondary))",
                border: "1px dashed oklch(var(--border))",
              }}
            >
              <FileText
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <p
                className="text-sm font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No training modules available.
              </p>
            </div>
          ) : (
            <ScrollArea
              className="h-[220px] rounded-lg border"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <div className="p-2 space-y-1">
                {modules.map((module) => {
                  const checked = selectedIds.has(module.id);
                  const completed = isCompleted(module.id);
                  return (
                    <Label
                      key={module.id}
                      htmlFor={`assign-${module.id}`}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer
                        transition-colors duration-150 hover:bg-secondary/60
                      `}
                      style={{
                        background: checked
                          ? "oklch(0.95 0.025 255)"
                          : "transparent",
                        border: checked
                          ? "1px solid oklch(0.75 0.06 255)"
                          : "1px solid transparent",
                      }}
                    >
                      <Checkbox
                        id={`assign-${module.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleModule(module.id)}
                        className="shrink-0"
                        style={
                          checked
                            ? {
                                background: "oklch(var(--primary))",
                                borderColor: "oklch(var(--primary))",
                              }
                            : {}
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-display font-semibold truncate"
                            style={{ color: "oklch(var(--foreground))" }}
                          >
                            {module.title}
                          </span>
                        </div>
                      </div>
                      {completed ? (
                        <Badge
                          className="shrink-0 text-xs font-semibold gap-1"
                          style={{
                            background: "oklch(0.95 0.05 145)",
                            color: "oklch(0.4 0.12 145)",
                            border: "1px solid oklch(0.72 0.14 145 / 40%)",
                          }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Done
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs font-semibold gap-1"
                          style={{
                            background: "oklch(0.97 0.06 85)",
                            color: "oklch(0.45 0.1 80)",
                            border: "1px solid oklch(0.78 0.14 80 / 40%)",
                          }}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          Pending
                        </Badge>
                      )}
                    </Label>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="admin.user_profile.close_button"
            className="font-display font-semibold"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            data-ocid="admin.user_profile.save_button"
            disabled={isSaving}
            className="font-display font-semibold gap-2"
            style={{ background: "oklch(var(--primary))" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Assignments"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
