import { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingModule = {
  id: string;
  title: string;
  description: string;
  googleDocUrl: string;
  createdAt: number;
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
};

export type UserAssignment = {
  userId: string;
  moduleIds: string[];
};

// ─── localStorage keys ────────────────────────────────────────────────────────

const MODULES_KEY = "training_modules";
const COMPLETIONS_KEY = "training_completions";
const USERS_KEY = "training_users";
const ASSIGNMENTS_KEY = "training_assignments";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_MODULES: TrainingModule[] = [
  {
    id: "seed-1",
    title: "Fire Safety SOP",
    description:
      "Emergency evacuation procedures and fire safety protocols for all staff. Covers assembly points, extinguisher usage, and reporting procedures.",
    googleDocUrl:
      "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: "seed-2",
    title: "Health & Safety Onboarding",
    description:
      "Workplace health and safety induction for all new employees. Covers hazard identification, PPE requirements, and incident reporting.",
    googleDocUrl:
      "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: "seed-3",
    title: "Data Privacy & GDPR Compliance",
    description:
      "Understanding of data protection principles, employee obligations, and how to handle personal data in compliance with GDPR.",
    googleDocUrl:
      "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
];

const SEED_USERS: AppUser[] = [
  {
    id: "user-seed-1",
    name: "Sarah Mitchell",
    role: "Operations Manager",
    department: "Operations",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: "user-seed-2",
    name: "James Okafor",
    role: "Safety Officer",
    department: "Health & Safety",
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    id: "user-seed-3",
    name: "Priya Sharma",
    role: "HR Coordinator",
    department: "Human Resources",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

const SEED_ASSIGNMENTS: UserAssignment[] = [
  { userId: "user-seed-1", moduleIds: ["seed-1", "seed-2"] },
  { userId: "user-seed-2", moduleIds: ["seed-1", "seed-3"] },
  { userId: "user-seed-3", moduleIds: ["seed-2", "seed-3"] },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadModules(): TrainingModule[] {
  try {
    const raw = localStorage.getItem(MODULES_KEY);
    if (raw) return JSON.parse(raw) as TrainingModule[];
  } catch {
    // ignore
  }
  // Seed on first load
  localStorage.setItem(MODULES_KEY, JSON.stringify(SEED_MODULES));
  return SEED_MODULES;
}

function saveModules(modules: TrainingModule[]): void {
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
}

function loadCompletions(): CompletionRecord[] {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    if (raw) return JSON.parse(raw) as CompletionRecord[];
  } catch {
    // ignore
  }
  return [];
}

function saveCompletions(completions: CompletionRecord[]): void {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as AppUser[];
  } catch {
    // ignore
  }
  // Seed on first load
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  return SEED_USERS;
}

function saveUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadAssignments(): UserAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw) as UserAssignment[];
  } catch {
    // ignore
  }
  // Seed on first load
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(SEED_ASSIGNMENTS));
  return SEED_ASSIGNMENTS;
}

function saveAssignments(assignments: UserAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainingData() {
  const [modules, setModules] = useState<TrainingModule[]>(() => loadModules());
  const [completions, setCompletions] = useState<CompletionRecord[]>(() =>
    loadCompletions(),
  );
  const [users, setUsers] = useState<AppUser[]>(() => loadUsers());
  const [assignments, setAssignments] = useState<UserAssignment[]>(() =>
    loadAssignments(),
  );

  // Sync to localStorage
  useEffect(() => {
    saveModules(modules);
  }, [modules]);
  useEffect(() => {
    saveCompletions(completions);
  }, [completions]);
  useEffect(() => {
    saveUsers(users);
  }, [users]);
  useEffect(() => {
    saveAssignments(assignments);
  }, [assignments]);

  // ── Modules CRUD ─────────────────────────────────────────────────────────────

  const createModule = useCallback(
    (data: Omit<TrainingModule, "id" | "createdAt">) => {
      const newModule: TrainingModule = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
      setModules((prev) => [...prev, newModule]);
      return newModule;
    },
    [],
  );

  const updateModule = useCallback(
    (id: string, data: Partial<Omit<TrainingModule, "id" | "createdAt">>) => {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m)),
      );
    },
    [],
  );

  const deleteModule = useCallback((id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    // Also delete associated completions
    setCompletions((prev) => prev.filter((c) => c.moduleId !== id));
    // Also remove from all user assignments
    setAssignments((prev) =>
      prev.map((a) => ({
        ...a,
        moduleIds: a.moduleIds.filter((mid) => mid !== id),
      })),
    );
  }, []);

  // ── Completions ───────────────────────────────────────────────────────────────

  const addCompletion = useCallback(
    (data: Omit<CompletionRecord, "id" | "completedAt">) => {
      const newCompletion: CompletionRecord = {
        ...data,
        id: generateId(),
        completedAt: Date.now(),
      };
      setCompletions((prev) => [...prev, newCompletion]);
      return newCompletion;
    },
    [],
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

  // ── Users CRUD ────────────────────────────────────────────────────────────────

  const createUser = useCallback((data: Omit<AppUser, "id" | "createdAt">) => {
    const newUser: AppUser = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    // Start with empty assignment for new user
    setAssignments((prev) => [...prev, { userId: newUser.id, moduleIds: [] }]);
    return newUser;
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setAssignments((prev) => prev.filter((a) => a.userId !== id));
  }, []);

  const getUsers = useCallback(() => users, [users]);

  // ── Assignments ───────────────────────────────────────────────────────────────

  const assignModulesToUser = useCallback(
    (userId: string, moduleIds: string[]) => {
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
    [],
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

  return {
    modules,
    completions,
    users,
    assignments,
    createModule,
    updateModule,
    deleteModule,
    addCompletion,
    getCompletionForModule,
    createUser,
    deleteUser,
    getUsers,
    assignModulesToUser,
    getAssignedModulesForUser,
    getAssignedModuleIdsForUser,
  };
}
