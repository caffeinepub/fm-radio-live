import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";



actor {
  // User statistics types
  type UserStats = {
    weeklyActiveUsers : Nat;
    monthlyActiveUsers : Nat;
    lifetimeUsers : Nat;
  };

  type ChannelStatus = {
    liveChannels : Nat;
    offlineChannels : Nat;
  };

  type UserProfile = {
    name : Text;
    // Add more user metadata if needed
  };

  // User statistics state
  let userStats = Map.empty<Principal, UserStats>();
  let channelStatus = Map.empty<Principal, ChannelStatus>();

  // Access control state
  let accessControlState = AccessControl.initState();

  // Authentication and authorization functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
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

  // User profile management
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User statistics management
  public shared ({ caller }) func updateUserStats(stats : UserStats) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update stats");
    };
    userStats.add(caller, stats);
  };

  public query ({ caller }) func getUserStats() : async ?UserStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access stats");
    };
    userStats.get(caller);
  };

  public query ({ caller }) func getUserStatsForUser(user : Principal) : async ?UserStats {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own stats or must be admin");
    };
    userStats.get(user);
  };

  // Channel status management
  public shared ({ caller }) func updateChannelStatus(status : ChannelStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update channel status");
    };
    channelStatus.add(caller, status);
  };

  public query ({ caller }) func getChannelStatus() : async ?ChannelStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access channel status");
    };
    channelStatus.get(caller);
  };

  public query ({ caller }) func getChannelStatusForUser(user : Principal) : async ?ChannelStatus {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own channel status or must be admin");
    };
    channelStatus.get(user);
  };

  // Get all user stats (admin only)
  public query ({ caller }) func getAllUserStats() : async [(Principal, UserStats)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all user stats");
    };
    userStats.toArray();
  };

  // Get all channel statuses (admin only)
  public query ({ caller }) func getAllChannelStatuses() : async [(Principal, ChannelStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all channel statuses");
    };
    channelStatus.toArray();
  };

  // Get all user profiles (admin only)
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all user profiles");
    };
    userProfiles.toArray();
  };

  // Aggregate statistics for user dashboard - requires authentication
  // These are displayed in the User Dashboard which is only visible after login
  public query ({ caller }) func getTotalUserCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    userProfiles.size();
  };

  public query ({ caller }) func getTotalChannelCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    channelStatus.size();
  };

  public query ({ caller }) func getTotalStatsCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    userStats.size();
  };

  public query ({ caller }) func getTotalLiveChannels() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    var total = 0;
    for ((_, status) in channelStatus.entries()) {
      total += status.liveChannels;
    };
    total;
  };

  public query ({ caller }) func getTotalOfflineChannels() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    var total = 0;
    for ((_, status) in channelStatus.entries()) {
      total += status.offlineChannels;
    };
    total;
  };

  public query ({ caller }) func getTotalWeeklyActiveUsers() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    var total = 0;
    for ((_, stats) in userStats.entries()) {
      total += stats.weeklyActiveUsers;
    };
    total;
  };

  public query ({ caller }) func getTotalMonthlyActiveUsers() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    var total = 0;
    for ((_, stats) in userStats.entries()) {
      total += stats.monthlyActiveUsers;
    };
    total;
  };

  public query ({ caller }) func getTotalLifetimeUsers() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };
    var total = 0;
    for ((_, stats) in userStats.entries()) {
      total += stats.lifetimeUsers;
    };
    total;
  };

  // Get all stats summary - requires authentication for user dashboard display
  public query ({ caller }) func getAllStatsSummary() : async {
    totalUsers : Nat;
    totalChannels : Nat;
    totalStats : Nat;
    totalLiveChannels : Nat;
    totalOfflineChannels : Nat;
    totalWeeklyActiveUsers : Nat;
    totalMonthlyActiveUsers : Nat;
    totalLifetimeUsers : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access dashboard statistics");
    };

    let totalUsers = userProfiles.size();
    let totalChannels = channelStatus.size();
    let totalStats = userStats.size();

    var totalLiveChannels = 0;
    var totalOfflineChannels = 0;
    for ((_, status) in channelStatus.entries()) {
      totalLiveChannels += status.liveChannels;
      totalOfflineChannels += status.offlineChannels;
    };

    var totalWeeklyActiveUsers = 0;
    var totalMonthlyActiveUsers = 0;
    var totalLifetimeUsers = 0;
    for ((_, stats) in userStats.entries()) {
      totalWeeklyActiveUsers += stats.weeklyActiveUsers;
      totalMonthlyActiveUsers += stats.monthlyActiveUsers;
      totalLifetimeUsers += stats.lifetimeUsers;
    };

    {
      totalUsers;
      totalChannels;
      totalStats;
      totalLiveChannels;
      totalOfflineChannels;
      totalWeeklyActiveUsers;
      totalMonthlyActiveUsers;
      totalLifetimeUsers;
    };
  };
};
