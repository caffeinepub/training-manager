import { useActor } from "@/hooks/useActor";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingModule = {
  id: string;
  title: string;
  description: string;
  googleDocUrl: string;
  createdAt: number;
  category?: string;
};

export type CompletionRecord = {
  id: string;
  moduleId: string;
  userId?: string;
  userName: string;
  initials: string;
  signatureData: string; // base64 canvas image — team member
  managerName?: string;
  managerSignatureData?: string; // base64 canvas image — manager
  completedAt: number;
  // Training type checkboxes
  trainingType?: {
    policy: boolean;
    sop: boolean;
    operationalManual: boolean;
  };
  // Steps of release process checkboxes
  releaseSteps?: {
    readOutLoud: boolean;
    demonstration: boolean;
    rolePlaying: boolean;
    independentExecution: boolean;
  };
  // Four initials for each acknowledgement statement
  acknowledgementInitials?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
};

export type AppUser = {
  id: string;
  name: string;
  role: string;
  department: string;
  createdAt: number;
  permission: "pending" | "viewer" | "admin" | "rejected";
  loginSource?: "google" | "manual";
  loginAt?: number;
  email?: string;
};

export type UserAssignment = {
  userId: string;
  moduleIds: string[];
};

// ─── Backend raw types ────────────────────────────────────────────────────────

type BackendModule = {
  id: bigint;
  title: string;
  description: string;
  googleDocUrl: string;
  createdAt: bigint;
  createdBy:
    | { _arr: Uint8Array; _isPrincipal: boolean }
    | { toString(): string };
};

type BackendCompletion = {
  id: bigint;
  moduleId: bigint;
  userId: { _arr: Uint8Array; _isPrincipal: boolean } | { toString(): string };
  userName: string;
  initials: string;
  signatureData: string;
  completedAt: bigint;
};

type BackendAppUser = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  permission: string;
  loginSource: string;
  createdAt: bigint;
  loginAt: bigint;
};

type BackendAssignment = {
  userId: string;
  moduleIds: string[];
};

// ─── Backend actor interface (runtime methods) ────────────────────────────────

type TrainingActor = {
  getModules: () => Promise<BackendModule[]>;
  getAllCompletions: () => Promise<BackendCompletion[]>;
  createModule: (
    title: string,
    description: string,
    googleDocUrl: string,
  ) => Promise<bigint>;
  updateModule: (
    id: bigint,
    title: string,
    description: string,
    googleDocUrl: string,
  ) => Promise<void>;
  deleteModule: (id: bigint) => Promise<void>;
  submitCompletion: (
    moduleId: bigint,
    userName: string,
    initials: string,
    signatureData: string,
  ) => Promise<bigint>;
  _initializeAccessControlWithSecret: (token: string) => Promise<void>;
  isCallerAdmin: () => Promise<boolean>;
  // Users
  createAppUser: (
    name: string,
    role: string,
    department: string,
    email: string,
  ) => Promise<string>;
  deleteAppUser: (userId: string) => Promise<void>;
  updateAppUserPermission: (
    userId: string,
    permission: string,
  ) => Promise<void>;
  getAppUsers: () => Promise<BackendAppUser[]>;
  registerGoogleUser: (name: string, email: string) => Promise<string>;
  approveUser: (userId: string, role: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  bootstrapAdmin: (userId: string) => Promise<void>;
  claimOwnership: (email: string) => Promise<boolean>;
  // Assignments
  assignModulesToUser: (userId: string, moduleIds: string[]) => Promise<void>;
  getAssignmentsForUser: (userId: string) => Promise<string[]>;
  getAllAssignments: () => Promise<BackendAssignment[]>;
  // Categories
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  getCategories: () => Promise<string[]>;
  setModuleCategory: (moduleId: string, category: string) => Promise<void>;
  getModuleCategories: () => Promise<[string, string][]>;
  submitPublicCompletionForUser: (
    moduleId: bigint,
    assignedUserId: string,
    userName: string,
    initials: string,
    signatureData: string,
  ) => Promise<bigint>;
  getPublicCompletionLinks: () => Promise<[bigint, string][]>;
};

// Rich completion extra fields stored in localStorage
type CompletionExtra = {
  managerName?: string;
  managerSignatureData?: string;
  trainingType?: CompletionRecord["trainingType"];
  releaseSteps?: CompletionRecord["releaseSteps"];
  acknowledgementInitials?: CompletionRecord["acknowledgementInitials"];
};

// ─── localStorage keys (session + completion extras only) ─────────────────────

const SESSION_KEY = "training_session";
// Extra completion data: { [completionId: string]: CompletionExtra }
const COMPLETION_EXTRAS_KEY = "training_completion_extras";

// ─── Session types ────────────────────────────────────────────────────────────

export type UserSession = {
  userId: string;
  name: string;
  email: string;
};

// ─── localStorage helpers (session + completion extras only) ──────────────────

function loadCompletionExtras(): Record<string, CompletionExtra> {
  try {
    const raw = localStorage.getItem(COMPLETION_EXTRAS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, CompletionExtra>;
  } catch {
    // ignore
  }
  return {};
}

function saveCompletionExtras(extras: Record<string, CompletionExtra>): void {
  localStorage.setItem(COMPLETION_EXTRAS_KEY, JSON.stringify(extras));
}

function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as UserSession;
  } catch {
    // ignore
  }
  return null;
}

function saveSession(session: UserSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

function backendModuleToFrontend(
  bm: BackendModule,
  categoryMap: Record<string, string>,
): TrainingModule {
  const idStr = Number(bm.id).toString();
  return {
    id: idStr,
    title: bm.title,
    description: bm.description,
    googleDocUrl: bm.googleDocUrl,
    createdAt: Number(bm.createdAt) / 1_000_000,
    category: categoryMap[idStr],
  };
}

function backendCompletionToFrontend(
  bc: BackendCompletion,
  extras: Record<string, CompletionExtra>,
): CompletionRecord {
  const idStr = Number(bc.id).toString();
  const extra = extras[idStr] ?? {};
  return {
    id: idStr,
    moduleId: Number(bc.moduleId).toString(),
    userId: bc.userId.toString(),
    userName: bc.userName,
    initials: bc.initials,
    signatureData: bc.signatureData,
    completedAt: Number(bc.completedAt) / 1_000_000,
    ...extra,
  };
}

function backendUserToFrontend(bu: BackendAppUser): AppUser {
  return {
    id: bu.id,
    name: bu.name,
    role: bu.role,
    department: bu.department,
    email: bu.email || undefined,
    permission: (["pending", "viewer", "admin", "rejected"].includes(
      bu.permission,
    )
      ? bu.permission
      : "pending") as "pending" | "viewer" | "admin" | "rejected",
    loginSource:
      bu.loginSource === "google"
        ? "google"
        : bu.loginSource === "manual"
          ? "manual"
          : undefined,
    createdAt: Number(bu.createdAt) / 1_000_000,
    loginAt:
      Number(bu.loginAt) > 0 ? Number(bu.loginAt) / 1_000_000 : undefined,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainingData() {
  const { actor: rawActor, isFetching: actorFetching } = useActor();
  // Cast to our typed actor interface — backend methods exist at runtime
  const actor = rawActor as unknown as TrainingActor | null;

  // Modules come from backend
  const [modules, setModules] = useState<TrainingModule[]>([]);
  // Completions come from backend (merged with localStorage extras)
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  // Category map: backend module id → category string (from backend)
  // Stored as a ref so mutation helpers can read/write it without triggering renders
  const moduleCategoryMapRef = useRef<Record<string, string>>({});

  // Completion extras: completion id → rich fields (localStorage)
  const [completionExtrasMap, setCompletionExtrasMap] = useState<
    Record<string, CompletionExtra>
  >(() => loadCompletionExtras());

  // Backend-persisted state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [publicCompletionLinks, setPublicCompletionLinks] = useState<
    Array<[bigint, string]>
  >([]);

  // Session is still per-device (localStorage)
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() =>
    loadSession(),
  );

  // Loading state: true until all data is loaded from backend
  const [isLoading, setIsLoading] = useState(true);
  // Track which actor instance we last fetched for, to re-fetch when it changes
  const lastActorRef = useRef<TrainingActor | null>(null);
  // Track which actor instances have been initialized with admin token
  const initializedActorsRef = useRef<Set<TrainingActor>>(new Set());

  // ── Ensure actor has admin access ─────────────────────────────────────────

  const ensureActorInitialized = useCallback(
    async (actorInstance: TrainingActor) => {
      if (initializedActorsRef.current.has(actorInstance)) return;
      try {
        const { getSecretParameter } = await import("@/utils/urlParams");
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        if (adminToken) {
          await actorInstance._initializeAccessControlWithSecret(adminToken);
        }
        initializedActorsRef.current.add(actorInstance);
      } catch {
        // Ignore if already initialized or token unavailable
        // Still mark as initialized to avoid repeated attempts
        initializedActorsRef.current.add(actorInstance);
      }
    },
    [],
  );

  // ── Sync completion extras to localStorage ────────────────────────────────

  useEffect(() => {
    saveCompletionExtras(completionExtrasMap);
  }, [completionExtrasMap]);

  // ── Fetch from backend when actor becomes available or changes ────────────

  useEffect(() => {
    // Wait until actor is ready and not in a loading/fetching state
    if (actorFetching || !actor) return;
    // Only re-fetch if the actor instance has changed (e.g., after auth init)
    if (lastActorRef.current === actor) return;
    lastActorRef.current = actor;

    const extras = loadCompletionExtras();

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // Ensure the caller has admin rights so all CRUD operations succeed.
        // This is needed for anonymous actors (app uses local Google login, not Internet Identity).
        await ensureActorInitialized(actor);

        // Fetch all data in parallel
        const [
          backendModules,
          backendCompletions,
          backendUsers,
          backendAssignments,
          backendCategories,
          backendModuleCategories,
          backendPublicCompletionLinks,
        ] = await Promise.all([
          actor.getModules(),
          actor.getAllCompletions(),
          actor.getAppUsers().catch(() => [] as BackendAppUser[]),
          actor.getAllAssignments().catch(() => [] as BackendAssignment[]),
          actor.getCategories().catch(() => [] as string[]),
          actor.getModuleCategories().catch(() => [] as [string, string][]),
          actor
            .getPublicCompletionLinks()
            .catch(() => [] as [bigint, string][]),
        ]);

        // Build category map from backend pairs
        const categoryMap: Record<string, string> = {};
        for (const [moduleId, category] of backendModuleCategories) {
          categoryMap[moduleId] = category;
        }
        moduleCategoryMapRef.current = categoryMap;

        const frontendModules = backendModules.map((bm) =>
          backendModuleToFrontend(bm, categoryMap),
        );
        setModules(frontendModules);

        const frontendCompletions = backendCompletions.map((bc) =>
          backendCompletionToFrontend(bc, extras),
        );
        setCompletions(frontendCompletions);

        const frontendUsers = backendUsers.map(backendUserToFrontend);
        setUsers(frontendUsers);

        setAssignments(
          backendAssignments.map((a) => ({
            userId: a.userId,
            moduleIds: a.moduleIds,
          })),
        );

        setCategories(backendCategories);
        setPublicCompletionLinks(
          backendPublicCompletionLinks as Array<[bigint, string]>,
        );

        // ── Auto-restore session ────────────────────────────────────────────
        // If a saved session exists but the user is NOT found in the backend
        // (e.g. after a fresh deployment that wiped backend state), automatically
        // re-register them and call bootstrapAdmin so they become admin again
        // if no other admins exist.
        const session = loadSession();
        if (session) {
          const found = frontendUsers.find(
            (u) =>
              u.email?.toLowerCase() === session.email.toLowerCase() ||
              u.id === session.userId,
          );
          if (!found) {
            try {
              const restoredId = await actor.registerGoogleUser(
                session.name,
                session.email,
              );
              try {
                await actor.bootstrapAdmin(restoredId);
              } catch {
                /* ignore — only promotes when no admins exist */
              }
              try {
                await actor.claimOwnership(session.email);
              } catch {
                /* ignore */
              }
              // Update session userId if the backend assigned a new one
              if (restoredId !== session.userId) {
                const updatedSession: UserSession = {
                  ...session,
                  userId: restoredId,
                };
                saveSession(updatedSession);
                setCurrentSession(updatedSession);
              }
              // Refresh the users list so the restored user is visible
              const refreshedBackendUsers = await actor.getAppUsers();
              setUsers(refreshedBackendUsers.map(backendUserToFrontend));
            } catch (err) {
              console.warn(
                "[useTrainingData] Auto-restore session failed:",
                err,
              );
            }
          }
        }
      } catch (err) {
        console.error("[useTrainingData] Failed to fetch from backend:", err);
        // Gracefully fall back to empty arrays
        setModules([]);
        setCompletions([]);
        setUsers([]);
        setAssignments([]);
        setCategories([]);
        setPublicCompletionLinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAll();
  }, [actor, actorFetching, ensureActorInitialized]);

  // If actor never loads, don't stay in loading state forever
  useEffect(() => {
    if (!actorFetching && !actor) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actor, actorFetching]);

  // ── Modules CRUD ──────────────────────────────────────────────────────────

  const createModule = useCallback(
    async (data: Omit<TrainingModule, "id" | "createdAt">) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for createModule");
        return null;
      }
      try {
        await ensureActorInitialized(actor);
        const backendId = await actor.createModule(
          data.title,
          data.description,
          data.googleDocUrl,
        );
        const idStr = Number(backendId).toString();

        // Store category in backend
        if (data.category) {
          try {
            await actor.setModuleCategory(idStr, data.category);
          } catch (err) {
            console.warn("[useTrainingData] setModuleCategory failed:", err);
          }
          moduleCategoryMapRef.current = {
            ...moduleCategoryMapRef.current,
            [idStr]: data.category!,
          };
        }

        const newModule: TrainingModule = {
          id: idStr,
          title: data.title,
          description: data.description,
          googleDocUrl: data.googleDocUrl,
          createdAt: Date.now(),
          category: data.category,
        };
        setModules((prev) => [...prev, newModule]);
        return newModule;
      } catch (err) {
        console.error("[useTrainingData] createModule failed:", err);
        return null;
      }
    },
    [actor, ensureActorInitialized],
  );

  const updateModule = useCallback(
    async (
      id: string,
      data: Partial<Omit<TrainingModule, "id" | "createdAt">>,
    ) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for updateModule");
        return;
      }
      try {
        await ensureActorInitialized(actor);
        // Get the current module to fill in blanks
        const current = modules.find((m) => m.id === id);
        if (!current) return;

        await actor.updateModule(
          BigInt(id),
          data.title ?? current.title,
          data.description ?? current.description,
          data.googleDocUrl ?? current.googleDocUrl,
        );

        // Update category in backend
        if (data.category !== undefined) {
          try {
            await actor.setModuleCategory(id, data.category ?? "");
          } catch (err) {
            console.warn("[useTrainingData] setModuleCategory failed:", err);
          }
          const catMapNext = { ...moduleCategoryMapRef.current };
          if (data.category) {
            catMapNext[id] = data.category;
          } else {
            delete catMapNext[id];
          }
          moduleCategoryMapRef.current = catMapNext;
        }

        setModules((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...data,
                  category:
                    data.category !== undefined ? data.category : m.category,
                }
              : m,
          ),
        );
      } catch (err) {
        console.error("[useTrainingData] updateModule failed:", err);
      }
    },
    [actor, modules, ensureActorInitialized],
  );

  const deleteModule = useCallback(
    async (id: string) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for deleteModule");
        return;
      }
      try {
        await ensureActorInitialized(actor);
        await actor.deleteModule(BigInt(id));

        setModules((prev) => prev.filter((m) => m.id !== id));
        // Remove category from local map (backend handles persistence)
        const catMapDel = { ...moduleCategoryMapRef.current };
        delete catMapDel[id];
        moduleCategoryMapRef.current = catMapDel;
        // Remove associated completions
        setCompletions((prev) => prev.filter((c) => c.moduleId !== id));
        // Remove from user assignments in local state
        setAssignments((prev) =>
          prev.map((a) => ({
            ...a,
            moduleIds: a.moduleIds.filter((mid) => mid !== id),
          })),
        );
      } catch (err) {
        console.error("[useTrainingData] deleteModule failed:", err);
      }
    },
    [actor, ensureActorInitialized],
  );

  // ── Completions ───────────────────────────────────────────────────────────

  const addCompletion = useCallback(
    async (data: Omit<CompletionRecord, "id" | "completedAt">) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for addCompletion");
        return null;
      }
      try {
        await ensureActorInitialized(actor);
        const backendId = await actor.submitCompletion(
          BigInt(data.moduleId),
          data.userName,
          data.initials,
          data.signatureData,
        );
        const idStr = Number(backendId).toString();

        // Store rich fields in localStorage
        const extra: CompletionExtra = {};
        if (data.managerName) extra.managerName = data.managerName;
        if (data.managerSignatureData)
          extra.managerSignatureData = data.managerSignatureData;
        if (data.trainingType) extra.trainingType = data.trainingType;
        if (data.releaseSteps) extra.releaseSteps = data.releaseSteps;
        if (data.acknowledgementInitials)
          extra.acknowledgementInitials = data.acknowledgementInitials;

        if (Object.keys(extra).length > 0) {
          setCompletionExtrasMap((prev) => {
            const next = { ...prev, [idStr]: extra };
            saveCompletionExtras(next);
            return next;
          });
        }

        const newCompletion: CompletionRecord = {
          id: idStr,
          moduleId: data.moduleId,
          userId: data.userId,
          userName: data.userName,
          initials: data.initials,
          signatureData: data.signatureData,
          completedAt: Date.now(),
          ...extra,
        };
        setCompletions((prev) => [...prev, newCompletion]);
        return newCompletion;
      } catch (err) {
        console.error("[useTrainingData] addCompletion failed:", err);
        return null;
      }
    },
    [actor, ensureActorInitialized],
  );

  const getCompletionForModule = useCallback(
    (moduleId: string, userId?: string): CompletionRecord | undefined => {
      if (userId) {
        return completions.find(
          (c) => c.moduleId === moduleId && c.userId === userId,
        );
      }
      return completions.find((c) => c.moduleId === moduleId);
    },
    [completions],
  );

  // ── Session / Google Login ────────────────────────────────────────────────

  const loginWithGoogle = useCallback(
    async (name: string, email: string) => {
      // Try to register/upsert via backend
      if (actor) {
        try {
          const userId = await actor.registerGoogleUser(name, email);
          // Bootstrap: if no admins exist, promote this user to admin
          try {
            await actor.bootstrapAdmin(userId);
          } catch {
            /* ignore */
          }
          // Claim ownership: permanently lock in this user as admin
          try {
            await actor.claimOwnership(email);
          } catch {
            /* ignore */
          }
          // Refresh users list from backend
          try {
            const backendUsers = await actor.getAppUsers();
            setUsers(backendUsers.map(backendUserToFrontend));
          } catch {
            // If fetch fails, add optimistically
            setUsers((prev) => {
              const existing = prev.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase(),
              );
              if (existing) {
                return prev.map((u) =>
                  u.id === existing.id
                    ? {
                        ...u,
                        loginAt: Date.now(),
                        loginSource: "google" as const,
                      }
                    : u,
                );
              }
              return [
                ...prev,
                {
                  id: userId,
                  name,
                  role: "",
                  department: "",
                  createdAt: Date.now(),
                  permission: "viewer" as const,
                  loginSource: "google" as const,
                  loginAt: Date.now(),
                  email,
                },
              ];
            });
          }
          const session: UserSession = { userId, name, email };
          setCurrentSession(session);
          saveSession(session);
          return;
        } catch (err) {
          console.warn(
            "[useTrainingData] registerGoogleUser failed, falling back to local:",
            err,
          );
        }
      }

      // Fallback: local-only (no backend)
      setUsers((prev) => {
        const existing = prev.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );
        const now = Date.now();
        let userId: string;

        if (existing) {
          userId = existing.id;
          const updated = prev.map((u) =>
            u.id === existing.id
              ? { ...u, loginAt: now, loginSource: "google" as const }
              : u,
          );
          const session: UserSession = { userId, name: existing.name, email };
          setCurrentSession(session);
          saveSession(session);
          return updated;
        }
        userId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newUser: AppUser = {
          id: userId,
          name,
          role: "",
          department: "",
          createdAt: now,
          permission: "viewer",
          loginSource: "google",
          loginAt: now,
          email,
        };
        const updated = [...prev, newUser];
        setAssignments((a) => [...a, { userId, moduleIds: [] }]);
        const session: UserSession = { userId, name, email };
        setCurrentSession(session);
        saveSession(session);
        return updated;
      });
    },
    [actor],
  );

  const logout = useCallback(() => {
    setCurrentSession(null);
    saveSession(null);
  }, []);

  // ── Users CRUD ────────────────────────────────────────────────────────────

  const createUser = useCallback(
    async (data: Omit<AppUser, "id" | "createdAt">) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for createUser");
        return null;
      }
      try {
        await ensureActorInitialized(actor);
        const userId = await actor.createAppUser(
          data.name,
          data.role ?? "",
          data.department ?? "",
          data.email ?? "",
        );
        const newUser: AppUser = {
          id: userId,
          name: data.name,
          role: data.role ?? "",
          department: data.department ?? "",
          email: data.email,
          permission: data.permission ?? "viewer",
          loginSource: data.loginSource,
          createdAt: Date.now(),
        };
        setUsers((prev) => [...prev, newUser]);
        setAssignments((prev) => [...prev, { userId, moduleIds: [] }]);
        return newUser;
      } catch (err) {
        console.error("[useTrainingData] createUser failed:", err);
        return null;
      }
    },
    [actor, ensureActorInitialized],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      if (!actor) {
        console.warn("[useTrainingData] No actor available for deleteUser");
        return;
      }
      try {
        await ensureActorInitialized(actor);
        await actor.deleteAppUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setAssignments((prev) => prev.filter((a) => a.userId !== id));
      } catch (err) {
        console.error("[useTrainingData] deleteUser failed:", err);
      }
    },
    [actor, ensureActorInitialized],
  );

  const getUsers = useCallback(() => users, [users]);

  const updateUserPermission = useCallback(
    async (
      userId: string,
      permission: "pending" | "viewer" | "admin" | "rejected",
    ) => {
      if (!actor) {
        console.warn(
          "[useTrainingData] No actor available for updateUserPermission",
        );
        return;
      }
      try {
        await ensureActorInitialized(actor);
        await actor.updateAppUserPermission(userId, permission);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, permission } : u)),
        );
      } catch (err) {
        console.error("[useTrainingData] updateUserPermission failed:", err);
      }
    },
    [actor, ensureActorInitialized],
  );

  const approveUser = useCallback(
    async (userId: string, role: string) => {
      if (!actor) return;
      try {
        await ensureActorInitialized(actor);
        await actor.approveUser(userId, role);
        const backendUsers = await actor.getAppUsers();
        setUsers(backendUsers.map(backendUserToFrontend));
      } catch (err) {
        console.error("[useTrainingData] approveUser failed:", err);
      }
    },
    [actor, ensureActorInitialized],
  );

  const rejectUser = useCallback(
    async (userId: string) => {
      if (!actor) return;
      try {
        await ensureActorInitialized(actor);
        await actor.rejectUser(userId);
        const backendUsers = await actor.getAppUsers();
        setUsers(backendUsers.map(backendUserToFrontend));
      } catch (err) {
        console.error("[useTrainingData] rejectUser failed:", err);
      }
    },
    [actor, ensureActorInitialized],
  );

  // ── Categories ────────────────────────────────────────────────────────────

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (actor) {
        try {
          await ensureActorInitialized(actor);
          await actor.addCategory(trimmed);
        } catch (err) {
          console.warn("[useTrainingData] addCategory failed:", err);
        }
      }
      setCategories((prev) => {
        if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase()))
          return prev;
        return [...prev, trimmed];
      });
    },
    [actor, ensureActorInitialized],
  );

  // ── Assignments ───────────────────────────────────────────────────────────

  const assignModulesToUser = useCallback(
    async (userId: string, moduleIds: string[]) => {
      if (actor) {
        try {
          await ensureActorInitialized(actor);
          await actor.assignModulesToUser(userId, moduleIds);
        } catch (err) {
          console.warn("[useTrainingData] assignModulesToUser failed:", err);
        }
      }
      // Optimistic local update
      setAssignments((prev) => {
        const exists = prev.some((a) => a.userId === userId);
        if (exists) {
          return prev.map((a) =>
            a.userId === userId ? { ...a, moduleIds } : a,
          );
        }
        return [...prev, { userId, moduleIds }];
      });
    },
    [actor, ensureActorInitialized],
  );

  const getAssignedModulesForUser = useCallback(
    (userId: string): TrainingModule[] => {
      const assignment = assignments.find((a) => a.userId === userId);
      if (!assignment) return [];
      return modules.filter((m) => assignment.moduleIds.includes(m.id));
    },
    [assignments, modules],
  );

  const getAssignedModuleIdsForUser = useCallback(
    (userId: string): string[] => {
      return assignments.find((a) => a.userId === userId)?.moduleIds ?? [];
    },
    [assignments],
  );

  // Derive current user's permission from their profile in the users list
  const currentUserPermission: "pending" | "viewer" | "admin" | "rejected" =
    (() => {
      if (!currentSession) return "pending";
      const found = users.find(
        (u) =>
          u.email?.toLowerCase() === currentSession.email.toLowerCase() ||
          u.id === currentSession.userId,
      );
      return found?.permission ?? "pending";
    })();

  return {
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
    getUsers,
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
  };
}
