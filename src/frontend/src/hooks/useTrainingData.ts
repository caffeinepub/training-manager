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
  userName: string;
  initials: string;
  signatureData: string; // base64 canvas image
  completedAt: number;
};

// ─── localStorage keys ────────────────────────────────────────────────────────

const MODULES_KEY = "training_modules";
const COMPLETIONS_KEY = "training_completions";

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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainingData() {
  const [modules, setModules] = useState<TrainingModule[]>(() => loadModules());
  const [completions, setCompletions] = useState<CompletionRecord[]>(() =>
    loadCompletions(),
  );

  // Sync modules to localStorage whenever they change
  useEffect(() => {
    saveModules(modules);
  }, [modules]);

  // Sync completions to localStorage whenever they change
  useEffect(() => {
    saveCompletions(completions);
  }, [completions]);

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
    (moduleId: string): CompletionRecord | undefined => {
      return completions.find((c) => c.moduleId === moduleId);
    },
    [completions],
  );

  return {
    modules,
    completions,
    createModule,
    updateModule,
    deleteModule,
    addCompletion,
    getCompletionForModule,
  };
}
