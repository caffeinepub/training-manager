import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
  UserAssignment,
} from "@/hooks/useTrainingData";
import {
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";

type DashboardViewProps = {
  modules: TrainingModule[];
  completions: CompletionRecord[];
  users: AppUser[];
  assignments: UserAssignment[];
  categories: string[];
};

// Category color hues to cycle through
const CATEGORY_HUES = [255, 145, 80, 300, 185, 30, 220];

function getCategoryStyle(index: number) {
  const hue = CATEGORY_HUES[index % CATEGORY_HUES.length];
  return {
    background: `oklch(0.92 0.05 ${hue})`,
    color: `oklch(0.32 0.12 ${hue})`,
    border: `1px solid oklch(0.75 0.08 ${hue} / 50%)`,
  };
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

export default function DashboardView({
  modules,
  completions,
  users,
  assignments,
  categories,
}: DashboardViewProps) {
  // ── Stat calculations ──────────────────────────────────────────────────────

  const totalModules = modules.length;
  const totalUsers = users.length;
  const totalCompletions = completions.length;

  // Total assigned slots = sum of each user's assigned module count
  const totalAssigned = assignments.reduce(
    (sum, a) => sum + a.moduleIds.length,
    0,
  );
  const completionRate =
    totalAssigned > 0
      ? Math.round((totalCompletions / totalAssigned) * 100)
      : 0;

  // ── Per-user training progress ─────────────────────────────────────────────

  const userProgress = users.map((user) => {
    const assignment = assignments.find((a) => a.userId === user.id);
    const assignedIds = assignment?.moduleIds ?? [];
    const completedCount = assignedIds.filter((mid) =>
      completions.some((c) => c.moduleId === mid),
    ).length;
    const pct =
      assignedIds.length > 0
        ? Math.round((completedCount / assignedIds.length) * 100)
        : 0;
    return {
      user,
      assignedCount: assignedIds.length,
      completedCount,
      pct,
    };
  });

  // ── Recently added modules ─────────────────────────────────────────────────

  const recentModules = [...modules]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // ── Category breakdown ─────────────────────────────────────────────────────

  const categoryMap: Record<string, number> = {};
  for (const module of modules) {
    const cat = module.category?.trim() || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
  }
  const categoryEntries = Object.entries(categoryMap).sort(
    ([, a], [, b]) => b - a,
  );

  // ── Stat card config ───────────────────────────────────────────────────────

  const statCards = [
    {
      label: "Total Modules",
      value: totalModules,
      icon: BookOpen,
      iconHue: 255,
      suffix: "",
    },
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      iconHue: 145,
      suffix: "",
    },
    {
      label: "Total Completions",
      value: totalCompletions,
      icon: CheckCircle2,
      iconHue: 145,
      suffix: "",
    },
    {
      label: "Completion Rate",
      value: completionRate,
      icon: TrendingUp,
      iconHue: 80,
      suffix: "%",
    },
  ];

  return (
    <div className="animate-fade-in space-y-8" data-ocid="dashboard.section">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-2xl font-display font-bold tracking-tight"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Training Dashboard
          </h2>
          <p
            className="text-sm font-body mt-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Overview of training activity, completion rates, and user progress.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-semibold"
          style={{
            background: "oklch(0.92 0.05 255)",
            color: "oklch(0.32 0.12 255)",
            border: "1px solid oklch(0.75 0.08 255 / 40%)",
          }}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Live Overview
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border shadow-card"
              style={{ borderColor: "oklch(var(--border))" }}
              data-ocid={`dashboard.stat.card.${idx + 1}`}
            >
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `oklch(0.93 0.04 ${stat.iconHue})`,
                    }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{
                        color: `oklch(0.42 0.14 ${stat.iconHue})`,
                        width: "1.1rem",
                        height: "1.1rem",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div
                    className="text-3xl font-display font-bold leading-none"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    {stat.value}
                    {stat.suffix}
                  </div>
                  <div
                    className="text-xs font-body mt-1.5"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Assigned vs Completed bar ── */}
      <Card
        className="border shadow-card"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.14 145)" }}
            />
            <CardTitle className="font-display font-bold text-base">
              Assigned vs Completed
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aggregate bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-body">
              <span style={{ color: "oklch(var(--muted-foreground))" }}>
                {totalCompletions} of {totalAssigned} assigned modules completed
              </span>
              <span
                className="font-display font-bold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                {completionRate}%
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: "oklch(0.93 0.015 240)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionRate}%`,
                  background:
                    completionRate >= 80
                      ? "oklch(0.65 0.14 145)"
                      : completionRate >= 40
                        ? "oklch(0.70 0.14 85)"
                        : "oklch(0.55 0.12 255)",
                }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs font-body">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "oklch(0.65 0.14 145)" }}
              />
              <span style={{ color: "oklch(var(--muted-foreground))" }}>
                Completed ({totalCompletions})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "oklch(0.88 0.015 240)" }}
              />
              <span style={{ color: "oklch(var(--muted-foreground))" }}>
                Pending ({Math.max(0, totalAssigned - totalCompletions)})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Per-User Training Progress ── */}
      <Card
        className="border shadow-card"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.12 255)" }}
            />
            <CardTitle className="font-display font-bold text-base">
              Per-User Training Progress
            </CardTitle>
            <Badge
              variant="secondary"
              className="ml-auto font-body text-xs"
              style={{
                background: "oklch(0.93 0.015 240)",
                color: "oklch(var(--muted-foreground))",
              }}
            >
              {users.length} users
            </Badge>
          </div>
        </CardHeader>
        <Separator style={{ background: "oklch(var(--border))" }} />
        <CardContent className="pt-4">
          {users.length === 0 ? (
            <div
              className="py-10 text-center rounded-lg"
              data-ocid="dashboard.users.empty_state"
              style={{
                background: "oklch(var(--secondary))",
                border: "1px dashed oklch(var(--border))",
              }}
            >
              <Users
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <p
                className="text-sm font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No users yet. Create users in the Admin panel.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="dashboard.users.list">
              {userProgress.map(
                ({ user, assignedCount, completedCount, pct }, idx) => (
                  <div
                    key={user.id}
                    className="space-y-2"
                    data-ocid={`dashboard.users.item.${idx + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-display font-bold"
                        style={{
                          background: "oklch(0.55 0.12 255)",
                          color: "oklch(0.95 0.01 240)",
                        }}
                      >
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-display font-semibold truncate"
                            style={{ color: "oklch(var(--foreground))" }}
                          >
                            {user.name}
                          </span>
                          {user.role && (
                            <span
                              className="text-xs font-body truncate"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              · {user.role}
                              {user.department ? ` · ${user.department}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <CheckCircle2
                              className="w-3 h-3"
                              style={{ color: "oklch(0.62 0.14 145)" }}
                            />
                            <span
                              className="text-xs font-body"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              {completedCount}/{assignedCount}
                            </span>
                          </div>
                          <span
                            className="text-xs font-display font-bold"
                            style={{
                              color:
                                pct >= 80
                                  ? "oklch(0.55 0.14 145)"
                                  : pct >= 40
                                    ? "oklch(0.60 0.13 80)"
                                    : "oklch(0.52 0.12 255)",
                            }}
                          >
                            {assignedCount === 0 ? "—" : `${pct}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {assignedCount > 0 && (
                      <div
                        className="ml-11 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "oklch(0.93 0.015 240)" }}
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
                    )}

                    {idx < userProgress.length - 1 && (
                      <Separator
                        className="mt-3"
                        style={{ background: "oklch(var(--border))" }}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom row: Recently Added + Category Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recently Added Modules */}
        <Card
          className="border shadow-card"
          style={{ borderColor: "oklch(var(--border))" }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock
                className="w-4 h-4"
                style={{ color: "oklch(0.62 0.14 80)" }}
              />
              <CardTitle className="font-display font-bold text-base">
                Recently Added
              </CardTitle>
            </div>
          </CardHeader>
          <Separator style={{ background: "oklch(var(--border))" }} />
          <CardContent className="pt-4">
            {recentModules.length === 0 ? (
              <div
                className="py-8 text-center"
                data-ocid="dashboard.recent.empty_state"
              >
                <BookOpen
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                />
                <p
                  className="text-sm font-body"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No modules yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="dashboard.recent.list">
                {recentModules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-3"
                    data-ocid={`dashboard.recent.item.${idx + 1}`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "oklch(0.93 0.04 255)" }}
                    >
                      <BookOpen
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.42 0.12 255)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-display font-semibold truncate leading-tight"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        {module.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {module.category && (
                          <span
                            className="text-xs font-body px-2 py-0.5 rounded-full"
                            style={getCategoryStyle(
                              categories.indexOf(module.category),
                            )}
                          >
                            {module.category}
                          </span>
                        )}
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {formatDate(module.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card
          className="border shadow-card"
          style={{ borderColor: "oklch(var(--border))" }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers
                className="w-4 h-4"
                style={{ color: "oklch(0.55 0.12 300)" }}
              />
              <CardTitle className="font-display font-bold text-base">
                Category Breakdown
              </CardTitle>
            </div>
          </CardHeader>
          <Separator style={{ background: "oklch(var(--border))" }} />
          <CardContent className="pt-4">
            {categoryEntries.length === 0 ? (
              <div
                className="py-8 text-center"
                data-ocid="dashboard.categories.empty_state"
              >
                <Award
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                />
                <p
                  className="text-sm font-body"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No categories yet.
                </p>
              </div>
            ) : (
              <div
                className="space-y-2.5"
                data-ocid="dashboard.categories.list"
              >
                {categoryEntries.map(([cat, count], idx) => {
                  const catIdx =
                    cat === "Uncategorized" ? -1 : categories.indexOf(cat);
                  const hue =
                    catIdx >= 0
                      ? CATEGORY_HUES[catIdx % CATEGORY_HUES.length]
                      : 240;
                  const maxCount = categoryEntries[0]?.[1] ?? 1;
                  const barPct = Math.round((count / maxCount) * 100);

                  return (
                    <div
                      key={cat}
                      className="space-y-1"
                      data-ocid={`dashboard.categories.item.${idx + 1}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-body font-medium px-2.5 py-0.5 rounded-full"
                          style={
                            cat === "Uncategorized"
                              ? {
                                  background: "oklch(0.93 0.015 240)",
                                  color: "oklch(0.52 0.03 245)",
                                  border:
                                    "1px solid oklch(0.85 0.015 240 / 60%)",
                                }
                              : {
                                  background: `oklch(0.92 0.05 ${hue})`,
                                  color: `oklch(0.32 0.12 ${hue})`,
                                  border: `1px solid oklch(0.75 0.08 ${hue} / 40%)`,
                                }
                          }
                        >
                          {cat}
                        </span>
                        <span
                          className="text-xs font-display font-bold"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {count} module{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "oklch(0.93 0.015 240)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            background:
                              cat === "Uncategorized"
                                ? "oklch(0.65 0.025 240)"
                                : `oklch(0.62 0.12 ${hue})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
