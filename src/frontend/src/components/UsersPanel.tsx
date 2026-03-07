import UserProfileModal from "@/components/UserProfileModal";
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
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
} from "@/hooks/useTrainingData";
import {
  BookOpen,
  Building2,
  Loader2,
  Plus,
  Trash2,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type UserFormData = {
  name: string;
  role: string;
  department: string;
};

const EMPTY_FORM: UserFormData = { name: "", role: "", department: "" };

type Props = {
  users: AppUser[];
  modules: TrainingModule[];
  completions: CompletionRecord[];
  getAssignedModuleIds: (userId: string) => string[];
  onCreate: (data: Omit<AppUser, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
  onAssign: (userId: string, moduleIds: string[]) => void;
};

export default function UsersPanel({
  users,
  modules,
  completions,
  getAssignedModuleIds,
  onCreate,
  onDelete,
  onAssign,
}: Props) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = (user: AppUser) => {
    setProfileUser(user);
    setProfileOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    onCreate({
      name: formData.name.trim(),
      role: formData.role.trim(),
      department: formData.department.trim(),
    });
    toast.success(`User "${formData.name.trim()}" created.`);
    setFormData(EMPTY_FORM);
    setCreateDialogOpen(false);
    setIsSaving(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    toast.success(`User "${deleteTarget.name}" removed.`);
    setDeleteTarget(null);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <div
        className="rounded-lg overflow-hidden"
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
            <Users
              className="w-4 h-4"
              style={{ color: "oklch(var(--primary))" }}
            />
            <h3
              className="font-display font-semibold"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Users
            </h3>
            <Badge variant="secondary" className="font-body text-xs ml-1">
              {users.length}
            </Badge>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-ocid="admin.create_user_button"
            size="sm"
            className="gap-2 font-display font-semibold"
            style={{ background: "oklch(var(--primary))" }}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Table or empty state */}
        {users.length === 0 ? (
          <div
            className="py-16 text-center"
            data-ocid="admin.users.empty_state"
          >
            <UserCircle
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
              Add your first user to start assigning training modules.
            </p>
          </div>
        ) : (
          <Table data-ocid="admin.users.table">
            <TableHeader>
              <TableRow style={{ background: "oklch(0.975 0.006 240)" }}>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">
                  Role
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                  Department
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[120px]">
                  Modules
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider hidden lg:table-cell w-[130px]">
                  Added
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider w-[130px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => {
                const assignedCount = getAssignedModuleIds(user.id).length;
                const userInitials = user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <TableRow
                    key={user.id}
                    data-ocid={`admin.users.row.${idx + 1}`}
                    className="hover:bg-secondary/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-xs"
                          style={{
                            background: "oklch(0.55 0.12 255)",
                            color: "oklch(0.95 0.01 240)",
                          }}
                        >
                          {userInitials}
                        </div>
                        <span className="font-display font-semibold text-sm">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <User
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        />
                        <span
                          className="text-sm font-body"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {user.role || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        />
                        <span
                          className="text-sm font-body"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {user.department || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <BookOpen
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "oklch(var(--primary))" }}
                        />
                        <span
                          className="text-sm font-body font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {assignedCount}
                        </span>
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          / {modules.length}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className="text-sm font-body"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openProfile(user)}
                          data-ocid={`admin.user.view_profile_button.${idx + 1}`}
                          className="h-7 px-2.5 gap-1.5 text-xs font-display font-semibold"
                          style={{ color: "oklch(var(--primary))" }}
                          title="View profile & assign modules"
                        >
                          <UserCircle className="w-3.5 h-3.5" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          data-ocid={`admin.user.delete_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Create User Dialog ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="admin.create_user_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              Add New User
            </DialogTitle>
            <DialogDescription className="font-body text-sm">
              Create a user account to assign training modules. No login
              required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="user-name"
                className="font-display font-semibold text-xs uppercase tracking-wider"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-name"
                data-ocid="admin.users.input"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Jane Smith"
                className="font-body"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="user-role"
                className="font-display font-semibold text-xs uppercase tracking-wider"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Role
              </Label>
              <Input
                id="user-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="e.g. Safety Officer"
                className="font-body"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="user-department"
                className="font-display font-semibold text-xs uppercase tracking-wider"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Department
              </Label>
              <Input
                id="user-department"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                placeholder="e.g. Operations"
                className="font-body"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setFormData(EMPTY_FORM);
                }}
                data-ocid="admin.create_user.cancel_button"
                className="font-display font-semibold"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="admin.create_user.submit_button"
                disabled={isSaving}
                className="font-display font-semibold gap-2"
                style={{ background: "oklch(var(--primary))" }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
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
              Remove User
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              Are you sure you want to remove{" "}
              <strong>"{deleteTarget?.name}"</strong>? Their module assignments
              will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete_user.cancel_button"
              className="font-display font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-ocid="admin.delete_user.confirm_button"
              className="bg-destructive text-destructive-foreground font-display font-semibold hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── User Profile Modal ── */}
      <UserProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={profileUser}
        modules={modules}
        assignedModuleIds={
          profileUser ? getAssignedModuleIds(profileUser.id) : []
        }
        completions={completions}
        onSave={onAssign}
      />
    </>
  );
}
