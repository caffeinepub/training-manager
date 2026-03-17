import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // ── PERMANENT OWNER — hardcoded constant, survives every reinstall ──────
  let OWNER_EMAIL : Text = "tvawdrey4@gmail.com";

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type TrainingModule = {
    id : Nat;
    title : Text;
    description : Text;
    googleDocUrl : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  public type CompletionRecord = {
    id : Nat;
    moduleId : Nat;
    userId : Principal;
    userName : Text;
    initials : Text;
    signatureData : Text;
    completedAt : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  public type AppUser = {
    id : Text;
    name : Text;
    role : Text;
    department : Text;
    createdAt : Int;
    permission : Text; // "pending" | "viewer" | "admin" | "rejected"
    loginSource : Text;
    loginAt : Int;
    email : Text;
  };

  public type UserAssignment = {
    userId : Text;
    moduleIds : [Text];
  };

  // ── Stable storage backing (survives upgrades) ──────────────────────────

  stable var _stableNextModuleId : Nat = 0;
  stable var _stableNextRecordId : Nat = 0;
  stable var _stableNextUserId : Nat = 0;

  stable var _stableModules : [(Nat, TrainingModule)] = [];
  stable var _stableCompletions : [(Nat, CompletionRecord)] = [];
  stable var _stableUserProfiles : [(Principal, UserProfile)] = [];
  stable var _stableAppUsers : [(Text, AppUser)] = [];
  stable var _stableAssignments : [(Text, UserAssignment)] = [];
  stable var _stableCategories : [(Text, Text)] = [];
  stable var _stableModuleToCategory : [(Text, Text)] = [];
  // Maps completionId -> appUserId for public link completions
  stable var _stablePublicCompletionLinks : [(Nat, Text)] = [];
  // Kept for upgrade compatibility — no longer used for logic (owner is hardcoded above)
  stable var _stableOwnerEmail : Text = "";

  // ── Runtime maps (populated from stable on startup) ─────────────────────

  var nextModuleId : Nat = _stableNextModuleId;
  var nextRecordId : Nat = _stableNextRecordId;
  var nextUserId : Nat = _stableNextUserId;

  let modules : Map.Map<Nat, TrainingModule> = Map.empty<Nat, TrainingModule>();
  let completions : Map.Map<Nat, CompletionRecord> = Map.empty<Nat, CompletionRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let appUsers = Map.empty<Text, AppUser>();
  let assignments = Map.empty<Text, UserAssignment>();
  let categories = Map.empty<Text, Text>();
  let moduleToCategory = Map.empty<Text, Text>();
  // completionId -> appUserId link for public completions
  let publicCompletionLinks = Map.empty<Nat, Text>();

  // Restore from stable storage on first run after upgrade
  do {
    for ((k, v) in _stableModules.values()) { modules.add(k, v) };
    for ((k, v) in _stableCompletions.values()) { completions.add(k, v) };
    for ((k, v) in _stableUserProfiles.values()) { userProfiles.add(k, v) };
    for ((k, v) in _stableAppUsers.values()) { appUsers.add(k, v) };
    for ((k, v) in _stableAssignments.values()) { assignments.add(k, v) };
    for ((k, v) in _stableCategories.values()) { categories.add(k, v) };
    for ((k, v) in _stableModuleToCategory.values()) { moduleToCategory.add(k, v) };
    for ((k, v) in _stablePublicCompletionLinks.values()) { publicCompletionLinks.add(k, v) };
  };

  // ── Upgrade hooks ────────────────────────────────────────────────────────

  system func preupgrade() {
    _stableNextModuleId := nextModuleId;
    _stableNextRecordId := nextRecordId;
    _stableNextUserId := nextUserId;
    _stableModules := modules.toArray();
    _stableCompletions := completions.toArray();
    _stableUserProfiles := userProfiles.toArray();
    _stableAppUsers := appUsers.toArray();
    _stableAssignments := assignments.toArray();
    _stableCategories := categories.toArray();
    _stableModuleToCategory := moduleToCategory.toArray();
    _stablePublicCompletionLinks := publicCompletionLinks.toArray();
    // _stableOwnerEmail kept for compatibility, no longer written
  };

  system func postupgrade() {};

  // ── Owner helpers — use hardcoded constant, never rely on storage ────────

  func isOwnerEmail(email : Text) : Bool {
    email == OWNER_EMAIL
  };

  func promoteOwnerIfNeeded(user : AppUser) : AppUser {
    if (isOwnerEmail(user.email) and user.permission != "admin") {
      { user with permission = "admin" }
    } else {
      user
    }
  };

  // Legacy claimOwnership kept for frontend compatibility — ownership is now
  // determined by the hardcoded constant so this just force-promotes if needed.
  public shared func claimOwnership(email : Text) : async Bool {
    if (isOwnerEmail(email)) {
      let found = appUsers.values().toArray().find(func(u) { u.email == email });
      switch (found) {
        case (?u) {
          if (u.permission != "admin") {
            appUsers.add(u.id, { u with permission = "admin" });
          };
        };
        case (null) {};
      };
      return true;
    };
    return false;
  };

  // ── User Profile Management ──────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // ── Module CRUD ──────────────────────────────────────────────────────────

  public shared ({ caller }) func createModule(title : Text, description : Text, googleDocUrl : Text) : async Nat {
    let id = nextModuleId;
    nextModuleId += 1;
    modules.add(id, {
      id;
      title;
      description;
      googleDocUrl;
      createdAt = Time.now();
      createdBy = caller;
    });
    id;
  };

  public shared ({ caller }) func updateModule(id : Nat, title : Text, description : Text, googleDocUrl : Text) : async () {
    switch (modules.get(id)) {
      case (null) { Runtime.trap("Module not found") };
      case (?existing) {
        modules.add(id, {
          id = existing.id;
          title;
          description;
          googleDocUrl;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
        });
      };
    };
  };

  public shared ({ caller }) func deleteModule(id : Nat) : async () {
    modules.remove(id);

    let moduleIdText = id.toText();
    moduleToCategory.remove(moduleIdText);

    let allAssignments = assignments.toArray();
    for ((userId, assignment) in allAssignments.values()) {
      let filteredModules = assignment.moduleIds.filter(func(moduleId) { moduleId != moduleIdText });
      assignments.add(userId, { userId = assignment.userId; moduleIds = filteredModules });
    };
  };

  public query func getModules() : async [TrainingModule] {
    modules.values().toArray();
  };

  public query func getModule(id : Nat) : async ?TrainingModule {
    modules.get(id);
  };

  // ── Completion Records ───────────────────────────────────────────────────

  public shared ({ caller }) func submitCompletion(moduleId : Nat, userName : Text, initials : Text, signatureData : Text) : async Nat {
    let id = nextRecordId;
    nextRecordId += 1;
    completions.add(id, {
      id;
      moduleId;
      userId = caller;
      userName;
      initials;
      signatureData;
      completedAt = Time.now();
    });
    id;
  };

  // Submit a public link completion linked to a specific app user
  public shared ({ caller }) func submitPublicCompletionForUser(
    moduleId : Nat,
    assignedUserId : Text,
    userName : Text,
    initials : Text,
    signatureData : Text
  ) : async Nat {
    let id = nextRecordId;
    nextRecordId += 1;
    completions.add(id, {
      id;
      moduleId;
      userId = caller;
      userName;
      initials;
      signatureData;
      completedAt = Time.now();
    });
    // Store the link to the app user
    publicCompletionLinks.add(id, assignedUserId);
    id;
  };

  public query ({ caller }) func getCompletionsByModule(moduleId : Nat) : async [CompletionRecord] {
    completions.values().toArray().filter<CompletionRecord>(
      func(record) { record.moduleId == moduleId }
    );
  };

  public query ({ caller }) func getMyCompletions() : async [CompletionRecord] {
    completions.values().toArray().filter<CompletionRecord>(
      func(record) { record.userId == caller }
    );
  };

  public query ({ caller }) func hasCompletedModule(moduleId : Nat) : async Bool {
    let userId = caller;
    let found = completions.values().toArray().find(
      func(record) { record.userId == userId and record.moduleId == moduleId }
    );
    switch (found) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getAllCompletions() : async [CompletionRecord] {
    completions.values().toArray();
  };

  public shared ({ caller }) func deleteCompletion(id : Nat) : async () {
    completions.remove(id);
    publicCompletionLinks.remove(id);
  };

  // Returns all (completionId, appUserId) pairs for public link completions
  public query func getPublicCompletionLinks() : async [(Nat, Text)] {
    publicCompletionLinks.toArray();
  };

  // ── App User Management ──────────────────────────────────────────────────

  public shared ({ caller }) func createAppUser(name : Text, role : Text, department : Text, email : Text) : async Text {
    let id = "user-" # nextUserId.toText();
    nextUserId += 1;

    let newUser : AppUser = {
      id;
      name;
      role;
      department;
      createdAt = Time.now();
      permission = "viewer";
      loginSource = "";
      loginAt = 0;
      email;
    };

    appUsers.add(id, newUser);
    assignments.add(id, { userId = id; moduleIds = [] });

    id;
  };

  public shared ({ caller }) func deleteAppUser(userId : Text) : async () {
    appUsers.remove(userId);
    assignments.remove(userId);
  };

  public shared ({ caller }) func updateAppUserPermission(userId : Text, permission : Text) : async () {
    switch (appUsers.get(userId)) {
      case (null) { Runtime.trap("App user not found") };
      case (?existing) {
        // Never demote the owner
        if (isOwnerEmail(existing.email) and permission != "admin") {
          return;
        };
        appUsers.add(userId, { existing with permission });
      };
    };
  };

  public shared ({ caller }) func approveUser(userId : Text, role : Text) : async () {
    switch (appUsers.get(userId)) {
      case (null) { Runtime.trap("App user not found") };
      case (?existing) {
        let permission = if (role == "admin") { "admin" } else { "viewer" };
        appUsers.add(userId, { existing with permission });
      };
    };
  };

  public shared ({ caller }) func rejectUser(userId : Text) : async () {
    switch (appUsers.get(userId)) {
      case (null) { Runtime.trap("App user not found") };
      case (?existing) {
        if (isOwnerEmail(existing.email)) { return; };
        appUsers.add(userId, { existing with permission = "rejected" });
      };
    };
  };

  public shared func bootstrapAdmin(userId : Text) : async () {
    let hasAdmin = appUsers.values().toArray().foldLeft(false, func(acc, u) { acc or u.permission == "admin" });
    if (not hasAdmin) {
      switch (appUsers.get(userId)) {
        case (null) { };
        case (?existing) {
          appUsers.add(userId, { existing with permission = "admin" });
        };
      };
    };
  };

  public query func getUserByEmail(email : Text) : async ?AppUser {
    let found = appUsers.values().toArray().find(
      func(user) { user.email == email }
    );
    switch (found) {
      case (?u) { ?promoteOwnerIfNeeded(u) };
      case (null) { null };
    };
  };

  public query func getAppUsers() : async [AppUser] {
    appUsers.values().toArray().map(promoteOwnerIfNeeded);
  };

  public query func getAppUser(userId : Text) : async ?AppUser {
    switch (appUsers.get(userId)) {
      case (?u) { ?promoteOwnerIfNeeded(u) };
      case (null) { null };
    };
  };

  public shared ({ caller }) func registerGoogleUser(name : Text, email : Text) : async Text {
    let existingUser = appUsers.values().toArray().find(
      func(user) { user.email == email }
    );

    switch (existingUser) {
      case (?existing) {
        // Owner always gets admin, no exceptions
        let perm = if (isOwnerEmail(email)) { "admin" } else { existing.permission };
        let updated = {
          existing with
          permission = perm;
          loginSource = "google";
          loginAt = Time.now()
        };
        appUsers.add(updated.id, updated);
        return updated.id;
      };
      case (null) {
        let id = "user-" # nextUserId.toText();
        nextUserId += 1;

        // Owner always gets admin immediately, even on first login after reinstall
        let initPerm = if (isOwnerEmail(email)) { "admin" } else { "pending" };

        let newUser : AppUser = {
          id;
          name;
          role = "";
          department = "";
          createdAt = Time.now();
          permission = initPerm;
          loginSource = "google";
          loginAt = Time.now();
          email;
        };

        appUsers.add(id, newUser);
        assignments.add(id, { userId = id; moduleIds = [] });
        return id;
      };
    };
  };

  // ── Assignment Methods ───────────────────────────────────────────────────

  public shared ({ caller }) func assignModulesToUser(userId : Text, moduleIds : [Text]) : async () {
    assignments.add(userId, { userId; moduleIds });
  };

  public query func getAssignmentsForUser(userId : Text) : async [Text] {
    switch (assignments.get(userId)) {
      case (null) { [] };
      case (?record) { record.moduleIds };
    };
  };

  public query func getAllAssignments() : async [UserAssignment] {
    assignments.values().toArray();
  };

  // ── Category Management ──────────────────────────────────────────────────

  public shared ({ caller }) func addCategory(name : Text) : async () {
    categories.add(name, name);
  };

  public shared ({ caller }) func deleteCategory(name : Text) : async () {
    categories.remove(name);

    let allMappings = moduleToCategory.toArray();
    for ((moduleId, cat) in allMappings.values()) {
      if (cat == name) {
        moduleToCategory.remove(moduleId);
      };
    };
  };

  public query func getCategories() : async [Text] {
    categories.values().toArray();
  };

  // ── Module-Category Mapping ──────────────────────────────────────────────

  public shared ({ caller }) func setModuleCategory(moduleId : Text, category : Text) : async () {
    if (category == "") {
      moduleToCategory.remove(moduleId);
    } else {
      moduleToCategory.add(moduleId, category);
    };
  };

  public query func getModuleCategories() : async [(Text, Text)] {
    moduleToCategory.toArray();
  };
};
