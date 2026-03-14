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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
} from "@/hooks/useTrainingData";
import { exportCompletionPdf } from "@/utils/exportPdf";
import { buildShareUrl } from "@/utils/shareLinks";
import {
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileDown,
  FileText,
  Loader2,
  Share2,
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
  allCompletions: CompletionRecord[];
  publicCompletionLinks: Array<[bigint, string]>;
  onSave: (userId: string, moduleIds: string[]) => void;
};

export default function UserProfileModal({
  open,
  onOpenChange,
  user,
  modules,
  assignedModuleIds,
  completions,
  allCompletions,
  publicCompletionLinks,
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

  const isCompleted = (moduleId: string) => {
    if (completions.some((c) => c.moduleId === moduleId)) return true;
    if (!user) return false;
    return publicCompletionLinks.some(
      ([completionId, linkedUserId]) =>
        linkedUserId === user.id &&
        allCompletions.some(
          (c) =>
            String(c.id) === String(completionId) && c.moduleId === moduleId,
        ),
    );
  };

  // Build assigned/completed lists from assignedModuleIds (not selectedIds)
  const assignedModules = modules.filter((m) =>
    assignedModuleIds.includes(m.id),
  );
  const pendingModules = assignedModules.filter((m) => !isCompleted(m.id));
  const completedModules = assignedModules.filter((m) => isCompleted(m.id));
  const totalAssigned = assignedModules.length;
  const totalCompleted = completedModules.length;
  const pct =
    totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

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
              className="h-[180px] rounded-lg border"
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
                        <span
                          className="text-sm font-display font-semibold truncate block"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {module.title}
                        </span>
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
                      {checked && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                data-ocid="admin.user_profile.copy_link_button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    buildShareUrl(module.id, user.id),
                                  );
                                  toast.success("Training link copied!");
                                }}
                                className="shrink-0 h-6 w-6 p-0 rounded"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="font-body text-xs"
                            >
                              Copy training link
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </Label>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator style={{ background: "oklch(var(--border))" }} />

        {/* ── Training Progress ── */}
        <div className="space-y-3">
          {/* Progress bar summary */}
          {totalAssigned > 0 && (
            <div
              className="rounded-lg px-4 py-3 space-y-2"
              style={{ background: "oklch(var(--secondary))" }}
            >
              <div className="flex items-center justify-between text-xs font-body">
                <span style={{ color: "oklch(var(--muted-foreground))" }}>
                  {totalCompleted} of {totalAssigned} modules completed
                </span>
                <span
                  className="font-display font-bold"
                  style={{
                    color:
                      pct >= 80
                        ? "oklch(0.52 0.14 145)"
                        : pct >= 40
                          ? "oklch(0.55 0.13 80)"
                          : "oklch(0.42 0.10 255)",
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "oklch(0.88 0.015 240)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct >= 80
                        ? "oklch(0.65 0.14 145)"
                        : pct >= 40
                          ? "oklch(0.70 0.14 85)"
                          : "oklch(0.55 0.12 255)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Assigned (Pending) section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock
                className="w-4 h-4"
                style={{ color: "oklch(0.55 0.13 80)" }}
              />
              <span
                className="font-display font-semibold text-sm"
                style={{ color: "oklch(0.55 0.13 80)" }}
              >
                Assigned
              </span>
              <span
                className="ml-auto text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.97 0.06 85)",
                  color: "oklch(0.45 0.1 80)",
                  border: "1px solid oklch(0.78 0.14 80 / 40%)",
                }}
              >
                {pendingModules.length}
              </span>
            </div>

            {pendingModules.length === 0 ? (
              <div
                className="py-3 px-4 rounded-lg text-center"
                data-ocid="profile.assigned.empty_state"
                style={{
                  background: "oklch(var(--secondary))",
                  border: "1px dashed oklch(var(--border))",
                }}
              >
                <p
                  className="text-xs font-body"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No pending modules
                </p>
              </div>
            ) : (
              <div className="space-y-1" data-ocid="profile.assigned.list">
                {pendingModules.map((module, idx) => (
                  <div
                    key={module.id}
                    data-ocid={`profile.assigned.item.${idx + 1}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{
                      background: "oklch(0.97 0.06 85 / 30%)",
                      border: "1px solid oklch(0.78 0.14 80 / 25%)",
                    }}
                  >
                    <Clock
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "oklch(0.60 0.12 80)" }}
                    />
                    <span
                      className="flex-1 text-sm font-body font-medium truncate"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {module.title}
                    </span>
                    {module.category && (
                      <span
                        className="text-xs font-body px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "oklch(0.92 0.03 245)",
                          color: "oklch(0.42 0.06 245)",
                          border: "1px solid oklch(0.82 0.04 245 / 50%)",
                        }}
                      >
                        {module.category}
                      </span>
                    )}
                    <span
                      className="text-xs font-body font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: "oklch(0.97 0.06 85)",
                        color: "oklch(0.45 0.1 80)",
                        border: "1px solid oklch(0.78 0.14 80 / 40%)",
                      }}
                    >
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: "oklch(0.52 0.14 145)" }}
              />
              <span
                className="font-display font-semibold text-sm"
                style={{ color: "oklch(0.52 0.14 145)" }}
              >
                Completed
              </span>
              <span
                className="ml-auto text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.93 0.05 145)",
                  color: "oklch(0.35 0.12 145)",
                  border: "1px solid oklch(0.72 0.14 145 / 40%)",
                }}
              >
                {completedModules.length}
              </span>
            </div>

            {completedModules.length === 0 ? (
              <div
                className="py-3 px-4 rounded-lg text-center"
                data-ocid="profile.completed.empty_state"
                style={{
                  background: "oklch(var(--secondary))",
                  border: "1px dashed oklch(var(--border))",
                }}
              >
                <p
                  className="text-xs font-body"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No completed modules yet
                </p>
              </div>
            ) : (
              <div className="space-y-1" data-ocid="profile.completed.list">
                {completedModules.map((module, idx) => (
                  <div
                    key={module.id}
                    data-ocid={`profile.completed.item.${idx + 1}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{
                      background: "oklch(0.93 0.05 145 / 30%)",
                      border: "1px solid oklch(0.72 0.14 145 / 25%)",
                    }}
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "oklch(0.52 0.14 145)" }}
                    />
                    <span
                      className="flex-1 text-sm font-body font-medium truncate"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {module.title}
                    </span>
                    {module.category && (
                      <span
                        className="text-xs font-body px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "oklch(0.92 0.03 245)",
                          color: "oklch(0.42 0.06 245)",
                          border: "1px solid oklch(0.82 0.04 245 / 50%)",
                        }}
                      >
                        {module.category}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: "oklch(0.93 0.05 145)",
                        color: "oklch(0.35 0.12 145)",
                        border: "1px solid oklch(0.72 0.14 145 / 40%)",
                      }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Completed
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            data-ocid={`profile.completed.download.${idx + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const comp = completions.find(
                                (c) => c.moduleId === module.id,
                              );
                              if (comp) exportCompletionPdf(module, comp);
                              else toast.error("Completion record not found");
                            }}
                          >
                            <FileDown className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            )}
          </div>
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
