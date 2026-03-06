import AdminPanel from "@/components/AdminPanel";
import ModuleCard from "@/components/ModuleCard";
import ModuleViewer from "@/components/ModuleViewer";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { useTrainingData } from "@/hooks/useTrainingData";
import type { TrainingModule } from "@/hooks/useTrainingData";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

type View = "modules" | "admin";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("modules");
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    modules,
    completions,
    createModule,
    updateModule,
    deleteModule,
    addCompletion,
    getCompletionForModule,
  } = useTrainingData();

  const completedCount = modules.filter((m) =>
    completions.some((c) => c.moduleId === m.id),
  ).length;

  const pendingCount = modules.length - completedCount;

  const navItems = [
    {
      id: "modules" as View,
      label: "Training Modules",
      icon: LayoutDashboard,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      id: "admin" as View,
      label: "Admin",
      icon: ShieldCheck,
    },
  ];

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSelectedModule(null);
    setSidebarOpen(false);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "oklch(var(--background))" }}
    >
      {/* ── Sidebar ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-foreground/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}

        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            flex flex-col w-64
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{
            background: "oklch(var(--sidebar))",
            borderRight: "1px solid oklch(var(--sidebar-border))",
          }}
        >
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-3 px-5 py-5 border-b"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(var(--sidebar-primary))" }}
            >
              <GraduationCap
                className="w-5 h-5"
                style={{ color: "oklch(var(--sidebar-primary-foreground))" }}
              />
            </div>
            <div>
              <h1
                className="font-display font-bold text-sm leading-tight"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
              >
                Training Manager
              </h1>
              <p
                className="text-xs font-body"
                style={{ color: "oklch(0.65 0.025 240)" }}
              >
                Compliance Platform
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden p-1 rounded"
              style={{ color: "oklch(var(--sidebar-foreground))" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats summary */}
          <div
            className="px-4 py-4 border-b"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div
                className="rounded-md p-2.5 text-center"
                style={{ background: "oklch(var(--sidebar-accent))" }}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2
                    className="w-3 h-3"
                    style={{ color: "oklch(0.72 0.14 145)" }}
                  />
                  <span
                    className="text-xs font-body"
                    style={{ color: "oklch(0.65 0.025 240)" }}
                  >
                    Done
                  </span>
                </div>
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "oklch(var(--sidebar-foreground))" }}
                >
                  {completedCount}
                </div>
              </div>
              <div
                className="rounded-md p-2.5 text-center"
                style={{ background: "oklch(var(--sidebar-accent))" }}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock
                    className="w-3 h-3"
                    style={{ color: "oklch(0.78 0.14 80)" }}
                  />
                  <span
                    className="text-xs font-body"
                    style={{ color: "oklch(0.65 0.025 240)" }}
                  >
                    Pending
                  </span>
                </div>
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "oklch(var(--sidebar-foreground))" }}
                >
                  {pendingCount}
                </div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && !selectedModule;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  data-ocid={`nav.${item.id}.link`}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    transition-colors duration-150 font-body font-medium text-sm
                  `}
                  style={{
                    background: isActive
                      ? "oklch(var(--sidebar-accent))"
                      : "transparent",
                    color: isActive
                      ? "oklch(var(--sidebar-foreground))"
                      : "oklch(0.65 0.025 240)",
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge
                      className="text-xs h-5 min-w-5 flex items-center justify-center font-display font-bold"
                      style={{
                        background: "oklch(0.78 0.14 80)",
                        color: "oklch(0.25 0.05 60)",
                        border: "none",
                      }}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                style={{
                  background: "oklch(0.55 0.12 255)",
                  color: "oklch(0.95 0.01 240)",
                }}
              >
                A
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-body font-semibold truncate"
                  style={{ color: "oklch(var(--sidebar-foreground))" }}
                >
                  Admin User
                </p>
                <p
                  className="text-xs font-body truncate"
                  style={{ color: "oklch(0.65 0.025 240)" }}
                >
                  Administrator
                </p>
              </div>
              <Badge
                className="ml-auto text-xs shrink-0"
                style={{
                  background: "oklch(0.55 0.12 255)",
                  color: "oklch(0.95 0.01 240)",
                  border: "none",
                }}
              >
                Admin
              </Badge>
            </div>
          </div>
        </aside>
      </>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center gap-4 px-4 lg:px-8 h-14 border-b"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
            boxShadow: "0 1px 6px 0 rgba(30, 45, 90, 0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            style={{ color: "oklch(var(--foreground))" }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-body">
            <span style={{ color: "oklch(var(--muted-foreground))" }}>
              Training Manager
            </span>
            <span style={{ color: "oklch(var(--muted-foreground))" }}>/</span>
            <span
              className="font-medium"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {selectedModule
                ? selectedModule.title
                : currentView === "modules"
                  ? "Training Modules"
                  : "Admin"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 text-sm font-body"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              <span>
                {completedCount} / {modules.length} completed
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-5xl w-full mx-auto">
          {/* Module Viewer */}
          {selectedModule ? (
            <ModuleViewer
              module={selectedModule}
              completion={getCompletionForModule(selectedModule.id)}
              onBack={() => setSelectedModule(null)}
              onComplete={(data) => {
                addCompletion({ moduleId: selectedModule.id, ...data });
              }}
            />
          ) : currentView === "modules" ? (
            /* ── Modules List ── */
            <div className="animate-fade-in">
              {/* Page header */}
              <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2
                    className="text-2xl font-display font-bold tracking-tight"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Training Modules
                  </h2>
                  <p
                    className="text-sm font-body mt-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Review and sign off on your assigned training documents.
                  </p>
                </div>

                {/* Progress summary */}
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border shrink-0"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <div className="text-right">
                    <div
                      className="text-xs font-body"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Progress
                    </div>
                    <div
                      className="text-lg font-display font-bold"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {modules.length > 0
                        ? Math.round((completedCount / modules.length) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div
                    className="w-px h-8"
                    style={{ background: "oklch(var(--border))" }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.72 0.14 145)" }}
                      />
                      <span
                        className="text-xs font-body"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {completedCount} completed
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.78 0.14 80)" }}
                      />
                      <span
                        className="text-xs font-body"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {pendingCount} pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules grid */}
              {modules.length === 0 ? (
                <div
                  data-ocid="modules.empty_state"
                  className="py-20 text-center rounded-lg border"
                  style={{
                    borderColor: "oklch(var(--border))",
                    background: "oklch(var(--card))",
                  }}
                >
                  <GraduationCap
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: "oklch(0.78 0.015 240)" }}
                  />
                  <h3
                    className="font-display font-semibold text-lg"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    No training modules yet
                  </h3>
                  <p
                    className="text-sm font-body mt-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Visit the Admin panel to create your first training module.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  data-ocid="modules.list"
                >
                  {modules.map((module, idx) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      completion={getCompletionForModule(module.id)}
                      index={idx + 1}
                      onView={() => setSelectedModule(module)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Admin Panel ── */
            <AdminPanel
              modules={modules}
              completions={completions}
              onCreate={createModule}
              onUpdate={updateModule}
              onDelete={deleteModule}
            />
          )}
        </main>

        {/* Footer */}
        <footer
          className="px-4 lg:px-8 py-4 border-t text-center"
          style={{
            borderColor: "oklch(var(--border))",
          }}
        >
          <p
            className="text-xs font-body"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            © {new Date().getFullYear()}. Built with{" "}
            <span style={{ color: "oklch(0.65 0.18 20)" }}>♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: "oklch(var(--primary))" }}
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
