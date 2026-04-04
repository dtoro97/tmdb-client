export type UserSessionMode = 'anonymous' | 'guest' | 'user';

export interface UserSessionState {
    guestSessionId: string | null;
    guestSessionExpiresAt: string | null;
    sessionId: string | null;
    v4AccessToken: string | null;
    v4AccountId: string | null;
    accountId: number | null;
    username: string | null;
    avatarPath: string | null;
    accountDetailsHydrated: boolean;
}
