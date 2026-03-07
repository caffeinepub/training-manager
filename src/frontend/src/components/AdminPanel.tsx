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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Note: modules table uses native HTML elements for better layout control
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
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ModuleFormData = {
  title: string;
  description: string;
  googleDocUrl: string;
};

type Props = {
  modules: TrainingModule[];
  completions: CompletionRecord[];
  users: AppUser[];
  onCreate: (data: Omit<TrainingModule, "id" | "createdAt">) => void;
  onUpdate: (
    id: string,
    data: Partial<Omit<TrainingModule, "id" | "createdAt">>,
  ) => void;
  onDelete: (id: string) => void;
  onView: (module: TrainingModule) => void;
  onCreateUser: (data: Omit<AppUser, "id" | "createdAt">) => void;
  onDeleteUser: (id: string) => void;
  onAssignModules: (userId: string, moduleIds: string[]) => void;
  getAssignedModuleIds: (userId: string) => string[];
};

const EMPTY_FORM: ModuleFormData = {
  title: "",
  description: "",
  googleDocUrl: "",
};

export default function AdminPanel({
  modules,
  completions,
  users,
  onCreate,
  onUpdate,
  onDelete,
  onView,
  onCreateUser,
  onDeleteUser,
  onAssignModules,
  getAssignedModuleIds,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(
    null,
  );
  const [formData, setFormData] = useState<ModuleFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<TrainingModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingModule(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (module: TrainingModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      googleDocUrl: module.googleDocUrl,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.googleDocUrl.trim()) {
      toast.error("Title and Google Doc URL are required.");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    if (editingModule) {
      onUpdate(editingModule.id, formData);
      toast.success("Module updated successfully.");
    } else {
      onCreate(formData);
      toast.success("Module created successfully.");
    }

    setDialogOpen(false);
    setFormData(EMPTY_FORM);
    setEditingModule(null);
    setIsSaving(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    toast.success(`"${deleteTarget.title}" has been deleted.`);
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
          Manage training modules and view completion records.
        </p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList
          className="mb-6 h-10"
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
                  style={{ minWidth: "600px" }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "oklch(0.975 0.006 240)",
                        borderBottom: "1px solid oklch(var(--border))",
                      }}
                    >
                      <th className="font-display font-semibold text-xs uppercase tracking-wider text-left px-4 py-3 w-[40%]">
                        Title
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
          />
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
    </div>
  );
}
