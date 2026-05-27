export type UserSessionMode = 'anonymous' | 'guest' | 'user';

export interface GuestSessionSnapshot {
    readonly guestSessionId: string;
    readonly expiresAt: string | null;
}

export interface UserSessionSnapshot {
    readonly sessionId: string;
}

export interface AccountSnapshot extends UserSessionSnapshot {
    readonly accountId: number;
    readonly username: string | null;
    readonly avatarPath: string | null;
}

export interface V4AccessSnapshot {
    readonly v4AccessToken: string;
    readonly v4AccountId: string;
}

export interface V4AccountAccessSnapshot extends AccountSnapshot, V4AccessSnapshot {}

export interface UserSessionState {
    readonly guestSession: GuestSessionSnapshot | null;
    readonly userSession: UserSessionSnapshot | null;
    readonly account: AccountSnapshot | null;
    readonly v4Access: V4AccessSnapshot | null;
}
