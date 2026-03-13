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
  currentSessionId?: string | null;
};

export default function UsersPanel({
  users,
  modules,
  completions,
  getAssignedModuleIds,
  onCreate,
  onDelete,
  onAssign,
  currentSessionId,
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
      permission: "viewer",
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
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider hidden xl:table-cell w-[150px]">
                  Signed In
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
                            background:
                              user.loginSource === "google"
                                ? "#4285F4"
                                : "oklch(0.55 0.12 255)",
                            color: "oklch(0.95 0.01 240)",
                          }}
                        >
                          {userInitials}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-display font-semibold text-sm">
                            {user.name}
                          </span>
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
                    <TableCell className="hidden xl:table-cell">
                      {user.loginSource === "google" && user.loginAt ? (
                        <div className="space-y-1">
                          <GoogleBadge />
                          <div
                            className="text-xs font-body"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {formatDate(user.loginAt)}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="text-sm font-body"
                          style={{ color: "oklch(0.78 0.015 240)" }}
                        >
                          —
                        </span>
                      )}
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
