import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppUser {
    id: string;
    permission: string;
    name: string;
    createdAt: bigint;
    role: string;
    loginSource: string;
    email: string;
    loginAt: bigint;
    department: string;
}
export interface CompletionRecord {
    id: bigint;
    moduleId: bigint;
    completedAt: bigint;
    userName: string;
    userId: Principal;
    initials: string;
    signatureData: string;
}
export interface TrainingModule {
    id: bigint;
    title: string;
    createdAt: bigint;
    createdBy: Principal;
    description: string;
    googleDocUrl: string;
}
export interface UserAssignment {
    moduleIds: Array<string>;
    userId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCategory(name: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignModulesToUser(userId: string, moduleIds: Array<string>): Promise<void>;
    createAppUser(name: string, role: string, department: string, email: string): Promise<string>;
    createModule(title: string, description: string, googleDocUrl: string): Promise<bigint>;
    deleteAppUser(userId: string): Promise<void>;
    deleteCategory(name: string): Promise<void>;
    deleteModule(id: bigint): Promise<void>;
    deleteCompletion(id: bigint): Promise<void>;
    getAllAssignments(): Promise<Array<UserAssignment>>;
    getAllCompletions(): Promise<Array<CompletionRecord>>;
    getAppUser(userId: string): Promise<AppUser | null>;
    getAppUsers(): Promise<Array<AppUser>>;
    getAssignmentsForUser(userId: string): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<string>>;
    getCompletionsByModule(moduleId: bigint): Promise<Array<CompletionRecord>>;
    getModule(id: bigint): Promise<TrainingModule | null>;
    getModuleCategories(): Promise<Array<[string, string]>>;
    getModules(): Promise<Array<TrainingModule>>;
    getMyCompletions(): Promise<Array<CompletionRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasCompletedModule(moduleId: bigint): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    registerGoogleUser(name: string, email: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setModuleCategory(moduleId: string, category: string): Promise<void>;
    submitCompletion(moduleId: bigint, userName: string, initials: string, signatureData: string): Promise<bigint>;
    submitPublicCompletionForUser(moduleId: bigint, assignedUserId: string, userName: string, initials: string, signatureData: string): Promise<bigint>;
    getPublicCompletionLinks(): Promise<Array<[bigint, string]>>;
    updateAppUserPermission(userId: string, permission: string): Promise<void>;
    updateModule(id: bigint, title: string, description: string, googleDocUrl: string): Promise<void>;
    approveUser(userId: string, role: string): Promise<void>;
    bootstrapAdmin(userId: string): Promise<void>;
    claimOwnership(email: string): Promise<boolean>;
    getUserByEmail(email: string): Promise<AppUser | null>;
    rejectUser(userId: string): Promise<void>;
}
