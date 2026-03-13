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
import { buildShareUrl } from "@/utils/shareLinks";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Share2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Category hues for skill badge coloring
const SKILL_CATEGORY_HUES: Record<string, number> = {};
const HUE_CYCLE = [255, 145, 80, 300, 185, 30, 220];
let hueIndex = 0;

function getHueForCategory(cat: string): number {
  if (cat === "General") return -1; // neutral
  if (!(cat in SKILL_CATEGORY_HUES)) {
    SKILL_CATEGORY_HUES[cat] = HUE_CYCLE[hueIndex % HUE_CYCLE.length];
    hueIndex++;
  }
  return SKILL_CATEGORY_HUES[cat];
}

type SkillsSectionProps = {
  user: AppUser;
  modules: TrainingModule[];
  assignedModuleIds: string[];
  completions: CompletionRecord[];
  isCompleted: (moduleId: string) => boolean;
};

function SkillsSection({
  modules,
  assignedModuleIds,
  isCompleted,
}: SkillsSectionProps) {
  const assignedModules = modules.filter((m) =>
    assignedModuleIds.includes(m.id),
  );
  const completedModules = assignedModules.filter((m) => isCompleted(m.id));

  const totalAssigned = assignedModules.length;
  const totalCompleted = completedModules.length;
  const pct =
    totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  // Group completed modules by category
  const grouped: Record<string, TrainingModule[]> = {};
  for (const m of completedModules) {
    const cat = m.category?.trim() || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  }
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "General") return 1;
    if (b === "General") return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <Separator style={{ background: "oklch(var(--border))" }} />

      <div>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4" style={{ color: "oklch(0.62 0.14 80)" }} />
          <span
            className="font-display font-semibold text-sm"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Skills & Progress
          </span>
        </div>

        {totalAssigned === 0 ? (
          <div
            className="py-5 text-center rounded-lg"
            style={{
              background: "oklch(var(--secondary))",
              border: "1px dashed oklch(var(--border))",
            }}
          >
            <p
              className="text-xs font-body"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              No training modules assigned yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress summary */}
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

            {/* Skill badges grouped by category */}
            {totalCompleted === 0 ? (
              <p
                className="text-xs font-body text-center py-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No skills earned yet — complete training modules to build your
                skill profile.
              </p>
            ) : (
              <div className="space-y-3">
                {groupEntries.map(([cat, mods]) => {
                  const hue = getHueForCategory(cat);
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-xs font-display font-semibold uppercase tracking-wider"
                          style={{
                            color:
                              hue < 0
                                ? "oklch(0.52 0.03 245)"
                                : `oklch(0.42 0.12 ${hue})`,
                          }}
                        >
                          {cat}
                        </span>
                        <div
                          className="flex-1 h-px"
                          style={{ background: "oklch(var(--border))" }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mods.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 text-xs font-body font-medium px-2.5 py-1 rounded-full"
                            style={
                              hue < 0
                                ? {
                                    background: "oklch(0.93 0.015 240)",
                                    color: "oklch(0.38 0.025 245)",
                                    border:
                                      "1px solid oklch(0.85 0.015 240 / 60%)",
                                  }
                                : {
                                    background: `oklch(0.93 0.04 ${hue})`,
                                    color: `oklch(0.32 0.12 ${hue})`,
                                    border: `1px solid oklch(0.75 0.08 ${hue} / 45%)`,
                                  }
                            }
                          >
                            <CheckCircle2
                              className="w-3 h-3 shrink-0"
                              style={{ opacity: 0.7 }}
                            />
                            {m.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

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

        {/* ── Skills & Progress ── */}
        <SkillsSection
          user={user}
          modules={modules}
          assignedModuleIds={Array.from(selectedIds)}
          completions={completions}
          isCompleted={isCompleted}
        />

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
