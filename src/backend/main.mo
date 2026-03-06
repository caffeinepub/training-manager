import Array "mo:core/Array";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Prim "mo:prim";
import AccessControl "./authorization/access-control";

actor {
  // ---- Access Control State ----
  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();

  // ---- Authorization (inlined from MixinAuthorization) ----
  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
      case (null) {
        Runtime.trap("CAFFEINE_ADMIN_TOKEN environment variable is not set");
      };
      case (?adminToken) {
        AccessControl.initialize(accessControlState, caller, adminToken, userSecret);
      };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ---- Types ----
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

  // ---- State ----
  var nextModuleId : Nat = 0;
  var nextRecordId : Nat = 0;

  let modules : Map.Map<Nat, TrainingModule> = Map.empty<Nat, TrainingModule>();
  let completions : Map.Map<Nat, CompletionRecord> = Map.empty<Nat, CompletionRecord>();

  // ---- Module CRUD ----

  public shared ({ caller }) func createModule(title : Text, description : Text, googleDocUrl : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create modules");
    };
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
    id
  };

  public shared ({ caller }) func updateModule(id : Nat, title : Text, description : Text, googleDocUrl : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update modules");
    };
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
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete modules");
    };
    modules.remove(id);
  };

  public query func getModules() : async [TrainingModule] {
    var result : [TrainingModule] = [];
    for ((_, m) in modules.entries()) {
      result := result.concat([m]);
    };
    result
  };

  public query func getModule(id : Nat) : async ?TrainingModule {
    modules.get(id)
  };

  // ---- Completion Records ----

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
    id
  };

  public shared ({ caller }) func getCompletionsByModule(moduleId : Nat) : async [CompletionRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all completions");
    };
    var result : [CompletionRecord] = [];
    for ((_, r) in completions.entries()) {
      if (r.moduleId == moduleId) {
        result := result.concat([r]);
      };
    };
    result
  };

  public shared ({ caller }) func getMyCompletions() : async [CompletionRecord] {
    var result : [CompletionRecord] = [];
    for ((_, r) in completions.entries()) {
      if (r.userId == caller) {
        result := result.concat([r]);
      };
    };
    result
  };

  public shared ({ caller }) func hasCompletedModule(moduleId : Nat) : async Bool {
    for ((_, r) in completions.entries()) {
      if (r.userId == caller and r.moduleId == moduleId) {
        return true;
      };
    };
    false
  };

  public shared ({ caller }) func getAllCompletions() : async [CompletionRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all completions");
    };
    var result : [CompletionRecord] = [];
    for ((_, r) in completions.entries()) {
      result := result.concat([r]);
    };
    result
  };
};
