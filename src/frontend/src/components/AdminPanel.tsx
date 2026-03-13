import UsersPanel from "@/components/UsersPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
} from "@/hooks/useTrainingData";
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

function GoogleBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-display font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        background: "oklch(0.96 0.02 145)",
        color: "oklch(0.35 0.12 145)",
        border: "1px solid oklch(0.80 0.10 145 / 40%)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Google
    </span>
  );
}
import { useState } from "react";
import { toast } from "sonner";

type ModuleFormData = {
  title: string;
  description: string;
  googleDocUrl: string;
  category: string;
};

type Props = {
  modules: TrainingModule[];
  completions: CompletionRecord[];
  users: AppUser[];
  categories: string[];
  currentSessionId?: string | null;
  onCreate: (
    data: Omit<TrainingModule, "id" | "createdAt">,
  ) => Promise<TrainingModule | null> | TrainingModule | null | undefined;
  onUpdate: (
    id: string,
    data: Partial<Omit<TrainingModule, "id" | "createdAt">>,
  ) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onView: (module: TrainingModule) => void;
  onCreateUser: (data: Omit<AppUser, "id" | "createdAt">) => void;
  onDeleteUser: (id: string) => void;
  onAssignModules: (userId: string, moduleIds: string[]) => void;
  getAssignedModuleIds: (userId: string) => string[];
  addCategory: (name: string) => void;
  updateUserPermission: (
    userId: string,
    permission: "pending" | "viewer" | "admin" | "rejected",
  ) => void;
  approveUser: (userId: string, role: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
};

const EMPTY_FORM: ModuleFormData = {
  title: "",
  description: "",
  googleDocUrl: "",
  category: "",
};

export default function AdminPanel({
  modules,
  completions,
  users,
  categories,
  currentSessionId,
  onCreate,
  onUpdate,
  onDelete,
  onView,
  onCreateUser,
  onDeleteUser,
  onAssignModules,
  getAssignedModuleIds,
  addCategory,
  updateUserPermission,
  approveUser,
  rejectUser,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(
    null,
  );
  const [formData, setFormData] = useState<ModuleFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TrainingModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AppUser | null>(null);

  const openCreate = () => {
    setEditingModule(null);
    setFormData(EMPTY_FORM);
    setNewCategoryInput("");
    setDialogOpen(true);
  };

  const openEdit = (module: TrainingModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      googleDocUrl: module.googleDocUrl,
      category: module.category ?? "",
    });
    setNewCategoryInput("");
    setDialogOpen(true);
  };

  const handleAddNewCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    addCategory(name);
    setFormData((prev) => ({ ...prev, category: name }));
    setNewCategoryInput("");
    toast.success(`Category "${name}" added.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.googleDocUrl.trim()) {
      toast.error("Title and Google Doc URL are required.");
      return;
    }

    setIsSaving(true);

    const payload: Omit<TrainingModule, "id" | "createdAt"> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      googleDocUrl: formData.googleDocUrl.trim(),
      ...(formData.category ? { category: formData.category } : {}),
    };

    try {
      if (editingModule) {
        await onUpdate(editingModule.id, payload);
        toast.success("Module updated successfully.");
      } else {
        await onCreate(payload);
        toast.success("Module created successfully.");
      }
    } catch {
      toast.error("Failed to save module. Please try again.");
    }

    setDialogOpen(false);
    setFormData(EMPTY_FORM);
    setEditingModule(null);
    setIsSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDelete(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" has been deleted.`);
    } catch {
      toast.error("Failed to delete module. Please try again.");
    }
    setDeleteTarget(null);
  };

  const formattedDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getModuleTitle = (moduleId: string) =>
    modules.find((m) => m.id === moduleId)?.title ?? "Unknown Module";

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-display font-bold tracking-tight"
          style={{ color: "oklch(var(--foreground))" }}
        >
          Admin Panel
        </h2>
        <p
          className="text-sm font-body mt-1"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          Manage training modules, users, permissions, and completion records.
        </p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList
          className="mb-6 h-10 flex flex-wrap gap-1"
          style={{ background: "oklch(var(--secondary))" }}
        >
          <TabsTrigger
            value="modules"
            data-ocid="admin.modules.tab"
            className="gap-2 font-display font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutGrid className="w-4 h-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger
            value="completions"
            data-ocid="admin.completions.tab"
            className="gap-2 font-display font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ClipboardList className="w-4 h-4" />
            Completion Records
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-ocid="admin.users.tab"
            className="gap-2 font-display font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            data-ocid="admin.permissions.tab"
            className="gap-2 font-display font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ShieldCheck className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger
            value="approvals"
            data-ocid="admin.approvals.tab"
            className="gap-2 font-display font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <UserCheck className="w-4 h-4" />
            Pending Approvals
            {users.filter((u) => u.permission === "pending").length > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{ background: "oklch(0.55 0.18 30)", color: "white" }}
              >
                {users.filter((u) => u.permission === "pending").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Modules Tab ── */}
        <TabsContent value="modules">
          <div
            className="rounded-lg"
            style={{
              border: "1.5px solid oklch(var(--border))",
              background: "oklch(var(--card))",
            }}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <h3
                  className="font-display font-semibold"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  Training Modules
                </h3>
                <Badge variant="secondary" className="font-body text-xs ml-1">
                  {modules.length}
                </Badge>
              </div>
              <Button
                onClick={openCreate}
                data-ocid="admin.create_module_button"
                size="sm"
                className="gap-2 font-display font-semibold"
                style={{ background: "oklch(var(--primary))" }}
              >
                <Plus className="w-4 h-4" />
                Create Module
              </Button>
            </div>

            {/* Table */}
            {modules.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.modules.empty_state"
              >
                <FileText
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.78 0.015 240)" }}
                />
                <p
                  className="font-display font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No modules yet
                </p>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Create your first training module to get started.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table
                  className="w-full table-fixed"
                  data-ocid="admin.modules.list"
                  style={{ minWidth: "640px" }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "oklch(0.975 0.006 240)",
                        borderBottom: "1px solid oklch(var(--border))",
                      }}
                    >
                      <th className="font-display font-semibold text-xs uppercase tracking-wider text-left px-4 py-3 w-[35%]">
                        Title
                      </th>
                      <th className="font-display font-semibold text-xs uppercase tracking-wider text-left px-4 py-3 w-[20%]">
                        Category
                      </th>
                      <th className="font-display font-semibold text-xs uppercase tracking-wider text-left px-4 py-3 hidden md:table-cell">
                        Description
                      </th>
                      <th className="font-display font-semibold text-xs uppercase tracking-wider text-left px-4 py-3 w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module, idx) => {
                      return (
                        <tr
                          key={module.id}
                          data-ocid={`admin.modules.row.${idx + 1}`}
                          className="hover:bg-secondary/40 transition-colors border-b last:border-b-0"
                          style={{ borderColor: "oklch(var(--border))" }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText
                                className="w-4 h-4 shrink-0"
                                style={{ color: "oklch(var(--primary))" }}
                              />
                              <span className="font-display font-semibold text-sm truncate">
                                {module.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {module.category ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-display font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  background: "oklch(0.92 0.04 280)",
                                  color: "oklch(0.35 0.12 280)",
                                  border:
                                    "1px solid oklch(0.78 0.08 280 / 40%)",
                                }}
                              >
                                <Tag className="w-3 h-3" />
                                {module.category}
                              </span>
                            ) : (
                              <span
                                className="text-xs font-body"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span
                              className="text-sm font-body line-clamp-1"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              {module.description}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(module)}
                                data-ocid={`admin.module.view_button.${idx + 1}`}
                                className="h-8 w-8 p-0 shrink-0"
                                title="View module"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(module)}
                                data-ocid={`admin.module.edit_button.${idx + 1}`}
                                className="h-8 w-8 p-0 shrink-0"
                                title="Edit module"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(module)}
                                data-ocid={`admin.module.delete_button.${idx + 1}`}
                                className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete module"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Completions Tab ── */}
        <TabsContent value="completions">
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: "1.5px solid oklch(var(--border))",
              background: "oklch(var(--card))",
            }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <ClipboardList
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <h3
                className="font-display font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Completion Records
              </h3>
              <Badge variant="secondary" className="font-body text-xs ml-1">
                {completions.length}
              </Badge>
            </div>

            {completions.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.completions.empty_state"
              >
                <ClipboardList
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.78 0.015 240)" }}
                />
                <p
                  className="font-display font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No completions yet
                </p>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Completion records will appear here once users sign off on
                  modules.
                </p>
              </div>
            ) : (
              <Table data-ocid="admin.completions.table">
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.975 0.006 240)" }}>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                      Module
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                      User Name
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[100px]">
                      Initials
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[120px]">
                      Signature
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[140px]">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completions.map((rec, idx) => (
                    <TableRow
                      key={rec.id}
                      data-ocid={`admin.completions.row.${idx + 1}`}
                      className="hover:bg-secondary/40 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: "oklch(var(--primary))" }}
                          />
                          <span className="font-body text-sm font-medium">
                            {getModuleTitle(rec.moduleId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-body text-sm">
                          {rec.userName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-display font-bold text-sm tracking-widest"
                          style={{ color: "oklch(var(--primary))" }}
                        >
                          {rec.initials}
                        </span>
                      </TableCell>
                      <TableCell>
                        <img
                          src={rec.signatureData}
                          alt={`Signature of ${rec.userName}`}
                          className="h-8 w-auto max-w-[100px] object-contain"
                          style={{
                            border: "1px solid oklch(var(--border))",
                            borderRadius: "4px",
                            padding: "2px",
                            background: "white",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            style={{ color: "oklch(0.72 0.14 145)" }}
                          />
                          <span
                            className="text-sm font-body"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {formattedDate(rec.completedAt)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users">
          <UsersPanel
            users={users}
            modules={modules}
            completions={completions}
            getAssignedModuleIds={getAssignedModuleIds}
            onCreate={onCreateUser}
            onDelete={onDeleteUser}
            onAssign={onAssignModules}
            currentSessionId={currentSessionId}
          />
        </TabsContent>

        {/* ── Permissions Tab ── */}
        <TabsContent value="permissions">
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: "1.5px solid oklch(var(--border))",
              background: "oklch(var(--card))",
            }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <ShieldCheck
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <h3
                className="font-display font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                User Permissions
              </h3>
              <Badge variant="secondary" className="font-body text-xs ml-1">
                {users.length}
              </Badge>
            </div>

            {users.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.permissions.empty_state"
              >
                <Users
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.78 0.015 240)" }}
                />
                <p
                  className="font-display font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No users yet
                </p>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Add users in the Users tab to manage their permissions here.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="px-5 py-3 text-xs font-body border-b"
                  style={{
                    background: "oklch(0.97 0.008 255)",
                    borderColor: "oklch(var(--border))",
                    color: "oklch(0.45 0.06 255)",
                  }}
                >
                  <span className="font-semibold">Admin</span> users can manage
                  modules, users, and completions.{" "}
                  <span className="font-semibold">Viewer</span> users can only
                  view and sign off on assigned modules.
                </div>
                <Table data-ocid="admin.permissions.table">
                  <TableHeader>
                    <TableRow style={{ background: "oklch(0.975 0.006 240)" }}>
                      <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                        Role / Department
                      </TableHead>
                      <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[140px]">
                        Permission
                      </TableHead>
                      <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[160px]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        data-ocid={`admin.permissions.row.${idx + 1}`}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-xs"
                              style={{
                                background:
                                  user.loginSource === "google"
                                    ? "#4285F4"
                                    : user.permission === "admin"
                                      ? "oklch(0.55 0.12 255)"
                                      : "oklch(0.88 0.015 240)",
                                color:
                                  user.loginSource === "google" ||
                                  user.permission === "admin"
                                    ? "white"
                                    : "oklch(0.45 0.02 240)",
                              }}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-body text-sm font-medium">
                                {user.name}
                              </span>
                              {user.loginSource === "google" && <GoogleBadge />}
                              {currentSessionId === user.id && (
                                <span
                                  className="text-xs font-body px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: "oklch(0.94 0.02 240)",
                                    color: "oklch(0.55 0.04 240)",
                                    border: "1px solid oklch(0.82 0.03 240)",
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm font-body"
                            style={{
                              color: "oklch(var(--muted-foreground))",
                            }}
                          >
                            {user.role}
                            {user.department ? ` · ${user.department}` : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.permission === "admin" ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-display font-bold px-2.5 py-1 rounded-full"
                              style={{
                                background: "oklch(0.55 0.12 255)",
                                color: "white",
                              }}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-display font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                background: "oklch(var(--secondary))",
                                color: "oklch(var(--muted-foreground))",
                                border: "1px solid oklch(var(--border))",
                              }}
                            >
                              Viewer
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.permission === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              data-ocid={`admin.permissions.demote_button.${idx + 1}`}
                              onClick={() =>
                                updateUserPermission(user.id, "viewer")
                              }
                              className="font-display font-semibold text-xs h-7 gap-1.5"
                              style={{
                                borderColor: "oklch(0.78 0.08 280 / 50%)",
                                color: "oklch(0.38 0.1 280)",
                              }}
                            >
                              Demote to Viewer
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              data-ocid={`admin.permissions.promote_button.${idx + 1}`}
                              onClick={() =>
                                updateUserPermission(user.id, "admin")
                              }
                              className="font-display font-semibold text-xs h-7 gap-1.5"
                              style={{
                                borderColor: "oklch(0.55 0.12 255 / 50%)",
                                color: "oklch(0.4 0.1 255)",
                              }}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Make Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Pending Approvals Tab ── */}
        <TabsContent value="approvals">
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: "1.5px solid oklch(var(--border))",
              background: "oklch(var(--card))",
            }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <UserCheck
                className="w-4 h-4"
                style={{ color: "oklch(0.55 0.18 30)" }}
              />
              <h3
                className="font-display font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Pending Approvals
              </h3>
              <span
                className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold font-body"
                style={{
                  background: "oklch(0.92 0.05 30)",
                  color: "oklch(0.45 0.15 30)",
                }}
              >
                {users.filter((u) => u.permission === "pending").length} pending
              </span>
            </div>
            <div
              className="px-5 py-3 text-xs font-body border-b"
              style={{
                background: "oklch(0.97 0.008 30)",
                borderColor: "oklch(var(--border))",
                color: "oklch(0.45 0.08 30)",
              }}
            >
              When someone registers with Google, their account is pending until
              you approve or reject it below.
            </div>

            {users.filter((u) => u.permission === "pending").length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="admin.approvals.empty_state"
              >
                <UserCheck
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.78 0.015 240)" }}
                />
                <p
                  className="font-display font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No pending registrations
                </p>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  New users who register with Google will appear here for
                  approval.
                </p>
              </div>
            ) : (
              <Table data-ocid="admin.approvals.table">
                <TableHeader>
                  <TableRow style={{ background: "oklch(0.975 0.006 240)" }}>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[140px]">
                      Registered
                    </TableHead>
                    <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[280px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((u) => u.permission === "pending")
                    .map((user, idx) => (
                      <TableRow
                        key={user.id}
                        data-ocid={`admin.approvals.row.${idx + 1}`}
                        className="hover:bg-secondary/40 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-xs"
                              style={{
                                background: "oklch(0.88 0.015 240)",
                                color: "oklch(0.45 0.02 240)",
                              }}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <span className="font-body text-sm font-medium">
                              {user.name}
                            </span>
                            <GoogleBadge />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm font-body"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm font-body"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              data-ocid={`admin.approvals.approve_viewer_button.${idx + 1}`}
                              onClick={() => approveUser(user.id, "viewer")}
                              className="font-display font-semibold text-xs h-7 gap-1.5"
                              style={{
                                background: "oklch(0.55 0.14 145)",
                                color: "white",
                              }}
                            >
                              Approve as User
                            </Button>
                            <Button
                              size="sm"
                              data-ocid={`admin.approvals.approve_admin_button.${idx + 1}`}
                              onClick={() => approveUser(user.id, "admin")}
                              className="font-display font-semibold text-xs h-7 gap-1.5"
                              style={{
                                background: "oklch(0.55 0.12 255)",
                                color: "white",
                              }}
                            >
                              Approve as Admin
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-ocid={`admin.approvals.reject_button.${idx + 1}`}
                              onClick={() => setRejectTarget(user)}
                              className="font-display font-semibold text-xs h-7 gap-1.5"
                              style={{
                                borderColor: "oklch(0.65 0.18 15 / 50%)",
                                color: "oklch(0.45 0.18 15)",
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg"
          data-ocid="admin.create_module_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              {editingModule ? "Edit Module" : "Create Training Module"}
            </DialogTitle>
            <DialogDescription className="font-body text-sm">
              {editingModule
                ? "Update the details for this training module."
                : "Add a new SOP document as a training module."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="mod-title"
                className="font-display font-semibold text-xs uppercase tracking-wider"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Module Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mod-title"
                data-ocid="admin.module.title.input"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g. Fire Safety SOP"
                className="font-body"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="mod-desc"
                className="font-display font-semibold text-xs uppercase tracking-wider"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Description
              </Label>
              <Textarea
                id="mod-desc"
                data-ocid="admin.module.description.textarea"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief overview of what this module covers..."
                className="font-body resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="mod-url"
                  className="font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Google Doc URL <span className="text-destructive">*</span>
                </Label>
                {formData.googleDocUrl.startsWith(
                  "https://docs.google.com/",
                ) && (
                  <a
                    href={formData.googleDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="admin.module.open_doc_link"
                    className="inline-flex items-center gap-1 text-xs font-body font-medium transition-colors hover:opacity-80"
                    style={{ color: "oklch(var(--primary))" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Doc
                  </a>
                )}
              </div>
              <Input
                id="mod-url"
                data-ocid="admin.module.url.input"
                value={formData.googleDocUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    googleDocUrl: e.target.value,
                  }))
                }
                placeholder="https://docs.google.com/document/d/..."
                className="font-body text-sm"
                type="url"
                required
              />
              <p
                className="text-xs font-body"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Paste the shareable link from your Google Doc. In Google Docs,
                go to{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  Share &rsaquo; Change to &ldquo;Anyone with the link&rdquo;
                  &rsaquo; Copy link.
                </span>
              </p>
            </div>

            {/* Category field */}
            <div className="space-y-1.5">
              <Label
                className="font-display font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                <Tag className="w-3.5 h-3.5" />
                Category
              </Label>
              <Select
                value={formData.category || "__none__"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: val === "__none__" ? "" : val,
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="admin.module.category.select"
                  className="font-body text-sm"
                >
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="font-body text-sm">
                    No category
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="font-body text-sm"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add new category inline */}
              <div className="flex gap-2 mt-1.5">
                <Input
                  data-ocid="admin.module.new_category.input"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewCategory();
                    }
                  }}
                  placeholder="Or type a new category..."
                  className="font-body text-sm h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="admin.module.add_category.button"
                  onClick={handleAddNewCategory}
                  disabled={!newCategoryInput.trim()}
                  className="h-8 shrink-0 font-display font-semibold text-xs gap-1"
                  style={{
                    borderColor: "oklch(0.78 0.08 280 / 50%)",
                    color: "oklch(0.38 0.1 280)",
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="admin.module.cancel_button"
                className="font-display font-semibold"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="admin.module.save_button"
                disabled={isSaving}
                className="font-display font-semibold gap-2"
                style={{ background: "oklch(var(--primary))" }}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : editingModule ? (
                  "Save Changes"
                ) : (
                  "Create Module"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold">
              Delete Module
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              Are you sure you want to delete{" "}
              <strong>"{deleteTarget?.title}"</strong>? This will also remove
              all associated completion records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete.cancel_button"
              className="font-display font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-ocid="admin.delete.confirm_button"
              className="bg-destructive text-destructive-foreground font-display font-semibold hover:bg-destructive/90"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ── Reject User Dialog ── */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold">
              Reject Registration
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              Are you sure you want to reject{" "}
              <strong>{rejectTarget?.name}</strong>? They will not be able to
              access the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.reject.cancel_button"
              className="font-display font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!rejectTarget) return;
                await rejectUser(rejectTarget.id);
                toast.success(
                  `${rejectTarget.name}'s registration has been rejected.`,
                );
                setRejectTarget(null);
              }}
              data-ocid="admin.reject.confirm_button"
              className="bg-destructive text-destructive-foreground font-display font-semibold hover:bg-destructive/90"
            >
              Reject Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
