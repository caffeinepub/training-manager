import AdminPanel from "@/components/AdminPanel";
import DashboardView from "@/components/DashboardView";
import LoginPage from "@/components/LoginPage";
import ModuleCard from "@/components/ModuleCard";
import ModuleViewer from "@/components/ModuleViewer";
import PublicModuleView from "@/components/PublicModuleView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useTrainingData } from "@/hooks/useTrainingData";
import type { TrainingModule } from "@/hooks/useTrainingData";
import { copyPublicModuleLink, copyShareLink } from "@/utils/shareLinks";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type View = "dashboard" | "admin";
type AdminSubView = "panel" | "module-viewer";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(
    null,
  );
  const [adminSubView, setAdminSubView] = useState<AdminSubView>("panel");
  const [adminViewingModule, setAdminViewingModule] =
    useState<TrainingModule | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    modules,
    completions,
    users,
    assignments,
    categories,
    currentSession,
    currentUserPermission,
    isLoading,
    createModule,
    updateModule,
    deleteModule,
    addCompletion,
    getCompletionForModule,
    createUser,
    deleteUser,
    updateUserPermission,
    approveUser,
    rejectUser,
    addCategory,
    assignModulesToUser,
    getAssignedModulesForUser,
    getAssignedModuleIdsForUser,
    publicCompletionLinks,
    loginWithGoogle,
    logout,
  } = useTrainingData();

  // Deep-link: auto-open module + user from URL params (?moduleId=…&userId=…)
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current) return;
    const params = new URLSearchParams(window.location.search);
    const moduleId = params.get("moduleId");
    const userId = params.get("userId");
    if (!moduleId || !userId) return;
    if (modules.length === 0 || users.length === 0) return;
    const module = modules.find((m) => m.id === moduleId);
    const user = users.find((u) => u.id === userId);
    if (module && user) {
      deepLinkApplied.current = true;
      setSelectedUserId(userId);
      setSelectedModule(module);
      history.replaceState({}, "", window.location.pathname);
    }
  }, [modules, users]);

  const isViewer = currentUserPermission === "viewer";

  // For viewers, always show their own assigned modules
  const effectiveUserId = isViewer
    ? (currentSession?.userId ?? null)
    : selectedUserId;

  // Filtered modules based on selected user, search query, and category
  const baseModules = effectiveUserId
    ? getAssignedModulesForUser(effectiveUserId)
    : modules;

  const displayedModules = baseModules;

  const selectedUser = users.find((u) => u.id === effectiveUserId) ?? null;

  const completedCount = displayedModules.filter((m) =>
    completions.some(
      (c) =>
        c.moduleId === m.id &&
        (effectiveUserId ? c.userId === effectiveUserId : true),
    ),
  ).length;

  const pendingCount = displayedModules.length - completedCount;

  const allNavItems = [
    {
      id: "dashboard" as View,
      label: "Dashboard",
      icon: BarChart2,
      adminOnly: true,
    },
    {
      id: "admin" as View,
      label: "Admin",
      icon: ShieldCheck,
      adminOnly: true,
    },
  ];
  const navItems = isViewer ? [] : allNavItems;

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSelectedModule(null);
    setAdminSubView("panel");
    setAdminViewingModule(null);
    setSidebarOpen(false);
  };

  const handleAdminViewModule = (module: TrainingModule) => {
    setAdminViewingModule(module);
    setAdminSubView("module-viewer");
  };

  const handleAdminBackFromModule = () => {
    setAdminViewingModule(null);
    setAdminSubView("panel");
  };

  // Public module link - no login required
  const publicModuleId = new URLSearchParams(window.location.search).get(
    "publicModule",
  );
  if (publicModuleId) {
    return (
      <>
        <PublicModuleView moduleId={publicModuleId} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Show login gate if not authenticated (after loading completes)
  if (!isLoading && !currentSession) {
    return (
      <>
        <LoginPage
          onLogin={(name, email) => {
            loginWithGoogle(name, email);
            toast.success(`Welcome, ${name}! You're now signed in.`);
          }}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Permission-based screens (after login)
  if (!isLoading && currentSession && currentUserPermission === "pending") {
    return (
      <>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "oklch(var(--background))" }}
        >
          <div className="max-w-md w-full mx-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "oklch(0.92 0.05 255)" }}
            >
              <Clock
                className="w-8 h-8"
                style={{ color: "oklch(0.45 0.12 255)" }}
              />
            </div>
            <h1
              className="text-2xl font-display font-bold mb-2"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Awaiting Approval
            </h1>
            <p
              className="font-body text-sm mb-1"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Hello,{" "}
              <span
                className="font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                {currentSession.name}
              </span>
              .
            </p>
            <p
              className="font-body text-sm mb-8"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Your account is pending review by an administrator. You'll have
              access once approved.
            </p>
            <Button
              data-ocid="pending.logout_button"
              variant="outline"
              onClick={() => {
                logout();
              }}
              className="gap-2 font-body"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (!isLoading && currentSession && currentUserPermission === "rejected") {
    return (
      <>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "oklch(var(--background))" }}
        >
          <div className="max-w-md w-full mx-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "oklch(0.94 0.05 15)" }}
            >
              <ShieldCheck
                className="w-8 h-8"
                style={{ color: "oklch(0.45 0.15 15)" }}
              />
            </div>
            <h1
              className="text-2xl font-display font-bold mb-2"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Access Denied
            </h1>
            <p
              className="font-body text-sm mb-8"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Your account request has been declined. Please contact your
              administrator if you believe this is a mistake.
            </p>
            <Button
              data-ocid="rejected.logout_button"
              variant="outline"
              onClick={() => {
                logout();
              }}
              className="gap-2 font-body"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </>
    );
  }

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
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            {/* Always logged-in when sidebar is visible (login gate ensures this) */}
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                style={{
                  background: "#4285F4",
                  color: "white",
                }}
              >
                {currentSession?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-body font-semibold truncate"
                  style={{ color: "oklch(var(--sidebar-foreground))" }}
                >
                  {currentSession?.name ?? ""}
                </p>
                <p
                  className="text-xs font-body truncate"
                  style={{ color: "oklch(0.65 0.025 240)" }}
                  title={currentSession?.email}
                >
                  {currentSession?.email ?? ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast.success("Signed out successfully.");
                }}
                data-ocid="sidebar.logout_button"
                title="Sign out"
                className="shrink-0 p-1.5 rounded-md transition-colors hover:opacity-70"
                style={{ color: "oklch(0.65 0.025 240)" }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
                : currentView === "admin" &&
                    adminSubView === "module-viewer" &&
                    adminViewingModule
                  ? adminViewingModule.title
                  : currentView === "dashboard"
                    ? "Dashboard"
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
          {/* Loading state */}
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center py-24 gap-4"
              data-ocid="app.loading_state"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(var(--primary) / 0.1)" }}
              >
                <Loader2
                  className="w-7 h-7 animate-spin"
                  style={{ color: "oklch(var(--primary))" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="font-display font-semibold text-base"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  Loading training data…
                </p>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Connecting to the backend
                </p>
              </div>
              {/* Skeleton cards */}
              <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-5 space-y-3 animate-pulse"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--card))",
                    }}
                  >
                    <div
                      className="h-4 rounded w-3/4"
                      style={{ background: "oklch(var(--muted))" }}
                    />
                    <div
                      className="h-3 rounded w-full"
                      style={{ background: "oklch(var(--muted))" }}
                    />
                    <div
                      className="h-3 rounded w-5/6"
                      style={{ background: "oklch(var(--muted))" }}
                    />
                    <div className="flex gap-2 pt-1">
                      <div
                        className="h-6 rounded-full w-16"
                        style={{ background: "oklch(var(--muted))" }}
                      />
                      <div
                        className="h-6 rounded-full w-20"
                        style={{ background: "oklch(var(--muted))" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isViewer && selectedModule ? (
            /* ── Viewer: Module Viewer ── */
            <ModuleViewer
              module={selectedModule}
              completion={getCompletionForModule(
                selectedModule.id,
                effectiveUserId ?? undefined,
              )}
              selectedUser={selectedUser}
              onBack={() => setSelectedModule(null)}
              onComplete={async (data) => {
                await addCompletion({
                  moduleId: selectedModule.id,
                  userId: effectiveUserId ?? undefined,
                  userName: data.userName,
                  initials: data.initials,
                  signatureData: data.signatureData,
                  managerName: data.managerName,
                  managerSignatureData: data.managerSignatureData,
                  trainingType: data.trainingType,
                  releaseSteps: data.releaseSteps,
                  acknowledgementInitials: data.acknowledgementInitials,
                });
              }}
            />
          ) : isViewer ? (
            /* ── Viewer: My Assigned Modules ── */
            <div className="animate-fade-in">
              <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2
                    className="text-2xl font-display font-bold tracking-tight"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    My Training Modules
                  </h2>
                  <p
                    className="text-sm font-body mt-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Review and sign off on your assigned training documents.
                  </p>
                </div>
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
                      {displayedModules.length > 0
                        ? Math.round(
                            (completedCount / displayedModules.length) * 100,
                          )
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

              {displayedModules.length === 0 ? (
                <div
                  data-ocid="viewer.modules.empty_state"
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
                    No modules assigned yet
                  </h3>
                  <p
                    className="text-sm font-body mt-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Your manager will assign training modules to you.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  data-ocid="viewer.modules.list"
                >
                  {displayedModules.map((module, idx) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      completion={getCompletionForModule(
                        module.id,
                        effectiveUserId ?? undefined,
                      )}
                      index={idx + 1}
                      onView={() => setSelectedModule(module)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : currentView === "dashboard" ? (
            /* ── Dashboard ── */
            <DashboardView
              modules={modules}
              completions={completions}
              users={users}
              assignments={assignments}
              categories={categories}
            />
          ) : currentView === "admin" &&
            adminSubView === "module-viewer" &&
            adminViewingModule ? (
            /* ── Admin Module Viewer (read-only, no sign-off) ── */
            <ModuleViewer
              module={adminViewingModule}
              completion={getCompletionForModule(
                adminViewingModule.id,
                undefined,
              )}
              adminMode={true}
              onBack={handleAdminBackFromModule}
              onComplete={() => {}}
            />
          ) : (
            /* ── Admin Panel ── */
            <AdminPanel
              modules={modules}
              completions={completions}
              users={users}
              categories={categories}
              currentSessionId={currentSession?.userId ?? null}
              onCreate={createModule}
              onUpdate={updateModule}
              onDelete={deleteModule}
              onView={handleAdminViewModule}
              onCreateUser={createUser}
              onDeleteUser={deleteUser}
              onAssignModules={assignModulesToUser}
              getAssignedModuleIds={getAssignedModuleIdsForUser}
              addCategory={addCategory}
              updateUserPermission={updateUserPermission}
              approveUser={approveUser}
              rejectUser={rejectUser}
              assignments={assignments}
              publicCompletionLinks={publicCompletionLinks}
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
