import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ChannelStatus {
    offlineChannels: bigint;
    liveChannels: bigint;
}
export interface UserStats {
    weeklyActiveUsers: bigint;
    monthlyActiveUsers: bigint;
    lifetimeUsers: bigint;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllChannelStatuses(): Promise<Array<[Principal, ChannelStatus]>>;
    getAllStatsSummary(): Promise<{
        totalMonthlyActiveUsers: bigint;
        totalLifetimeUsers: bigint;
        totalWeeklyActiveUsers: bigint;
        totalStats: bigint;
        totalOfflineChannels: bigint;
        totalChannels: bigint;
        totalUsers: bigint;
        totalLiveChannels: bigint;
    }>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getAllUserStats(): Promise<Array<[Principal, UserStats]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannelStatus(): Promise<ChannelStatus | null>;
    getChannelStatusForUser(user: Principal): Promise<ChannelStatus | null>;
    getTotalChannelCount(): Promise<bigint>;
    getTotalLifetimeUsers(): Promise<bigint>;
    getTotalLiveChannels(): Promise<bigint>;
    getTotalMonthlyActiveUsers(): Promise<bigint>;
    getTotalOfflineChannels(): Promise<bigint>;
    getTotalStatsCount(): Promise<bigint>;
    getTotalUserCount(): Promise<bigint>;
    getTotalWeeklyActiveUsers(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStats(): Promise<UserStats | null>;
    getUserStatsForUser(user: Principal): Promise<UserStats | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateChannelStatus(status: ChannelStatus): Promise<void>;
    updateUserStats(stats: UserStats): Promise<void>;
}
