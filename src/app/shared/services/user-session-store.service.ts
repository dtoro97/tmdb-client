import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import {
    AccountSnapshot,
    GuestSessionSnapshot,
    UserSessionMode,
    UserSessionSnapshot,
    UserSessionState,
    V4AccessSnapshot,
    V4AccountAccessSnapshot,
} from '../models';
import { BrowserStorageService } from './browser-storage.service';

const STORAGE_KEY_GUEST_SESSION_ID = 'tmdb_guest_session_id';
const STORAGE_KEY_GUEST_SESSION_EXPIRES_AT = 'tmdb_guest_session_expires_at';
const STORAGE_KEY_SESSION_ID = 'tmdb_user_session_id';
const STORAGE_KEY_V4_ACCESS_TOKEN = 'tmdb_v4_access_token';
const STORAGE_KEY_V4_ACCOUNT_ID = 'tmdb_v4_account_id';
const STORAGE_KEY_ACCOUNT_ID = 'tmdb_user_account_id';
const STORAGE_KEY_USERNAME = 'tmdb_username';
const STORAGE_KEY_AVATAR_PATH = 'tmdb_avatar_path';

const INITIAL_SESSION_STATE: UserSessionState = {
    guestSession: null,
    userSession: null,
    account: null,
    v4Access: null,
};

@Injectable({ providedIn: 'root' })
export class UserSessionStoreService extends ComponentStore<UserSessionState> {
    readonly mode$ = this.select((state) => this.toMode(state));
    readonly isAuthenticated$ = this.select(
        (state) => state.userSession !== null,
    );
    readonly hasAccount$ = this.select((state) => state.account !== null);
    readonly hasV4AccountAccess$ = this.select(
        (state) => state.account !== null && state.v4Access !== null,
    );
    readonly authViewModel$ = this.select((state) => {
        const username = state.account?.username?.trim() || null;

        return {
            isAuthenticated: state.userSession !== null,
            username,
            displayName: username ?? 'Member',
            avatarPath: state.account?.avatarPath ?? null,
        };
    });

    constructor(private readonly browserStorage: BrowserStorageService) {
        super(INITIAL_SESSION_STATE);
        this.setState(this.readInitialState());
    }

    mode(): UserSessionMode {
        return this.toMode(this.get());
    }

    isAuthenticated(): boolean {
        return this.get().userSession !== null;
    }

    hasAccount(): boolean {
        return this.get().account !== null;
    }

    hasV4AccountAccess(): boolean {
        const state = this.get();

        return state.account !== null && state.v4Access !== null;
    }

    requireUserSession(): UserSessionSnapshot {
        const userSession = this.get().userSession;

        if (!userSession) {
            throw new Error('A TMDb user session is required.');
        }

        return userSession;
    }

    requireAccount(): AccountSnapshot {
        const account = this.get().account;

        if (!account) {
            throw new Error('A TMDb account is required.');
        }

        return account;
    }

    requireV4AccountAccess(): V4AccountAccessSnapshot {
        const state = this.get();

        if (!state.account || !state.v4Access) {
            throw new Error('TMDb v4 account access is required.');
        }

        return {
            ...state.account,
            ...state.v4Access,
        };
    }

    guestSessionId(): string | null {
        return this.get().guestSession?.guestSessionId ?? null;
    }

    sessionId(): string | null {
        return this.get().userSession?.sessionId ?? null;
    }

    v4AccessToken(): string | null {
        return this.get().v4Access?.v4AccessToken ?? null;
    }

    v4AccountId(): string | null {
        return this.get().v4Access?.v4AccountId ?? null;
    }

    accountId(): number | null {
        return this.get().account?.accountId ?? null;
    }

    username(): string | null {
        return this.get().account?.username ?? null;
    }

    avatarPath(): string | null {
        return this.get().account?.avatarPath ?? null;
    }

    setGuestSession(guestSessionId: string, expiresAt: string | null): void {
        this.patchAndPersist({
            guestSession: this.toValidGuestSession({
                guestSessionId,
                expiresAt,
            }),
        });
    }

    setUserSession(
        sessionId: string,
        accountId: number | null = null,
        username: string | null = null,
        avatarPath: string | null = null,
        v4AccessToken: string | null = this.v4AccessToken(),
        v4AccountId: string | null = this.v4AccountId(),
    ): void {
        const userSession: UserSessionSnapshot = { sessionId };
        const account =
            accountId === null
                ? null
                : {
                      sessionId,
                      accountId,
                      username,
                      avatarPath,
                  };
        const v4Access =
            v4AccessToken && v4AccountId
                ? {
                      v4AccessToken,
                      v4AccountId,
                  }
                : null;

        this.patchAndPersist({
            guestSession: null,
            userSession,
            account,
            v4Access,
        });
    }

    setAccount(account: AccountSnapshot): void {
        this.patchAndPersist({
            userSession: { sessionId: account.sessionId },
            account,
        });
    }

    setV4AccountAccess(v4Access: V4AccessSnapshot): void {
        this.patchAndPersist({ v4Access });
    }

    clearUserSession(): void {
        this.patchAndPersist({
            userSession: null,
            account: null,
            v4Access: null,
        });
    }

    clearAllSessions(): void {
        this.setState(INITIAL_SESSION_STATE);
        this.syncToStorage(INITIAL_SESSION_STATE);
    }

    private patchAndPersist(patch: Partial<UserSessionState>): void {
        const nextState = this.sanitizeState({
            ...this.get(),
            ...patch,
        });

        this.setState(nextState);
        this.syncToStorage(nextState);
    }

    private syncToStorage(state: UserSessionState): void {
        this.browserStorage.writeItem(
            STORAGE_KEY_GUEST_SESSION_ID,
            state.guestSession?.guestSessionId ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_GUEST_SESSION_EXPIRES_AT,
            state.guestSession?.expiresAt ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_SESSION_ID,
            state.userSession?.sessionId ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_V4_ACCESS_TOKEN,
            state.v4Access?.v4AccessToken ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_V4_ACCOUNT_ID,
            state.v4Access?.v4AccountId ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_ACCOUNT_ID,
            state.account ? `${state.account.accountId}` : null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_USERNAME,
            state.account?.username ?? null,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_AVATAR_PATH,
            state.account?.avatarPath ?? null,
        );
    }

    private readInitialState(): UserSessionState {
        const sessionId = this.browserStorage.getItem(STORAGE_KEY_SESSION_ID);
        const accountId = this.parseAccountId(
            this.browserStorage.getItem(STORAGE_KEY_ACCOUNT_ID),
        );
        const v4AccessToken = this.browserStorage.getItem(
            STORAGE_KEY_V4_ACCESS_TOKEN,
        );
        const v4AccountId = this.browserStorage.getItem(
            STORAGE_KEY_V4_ACCOUNT_ID,
        );
        const guestSession = this.toValidGuestSession({
            guestSessionId: this.browserStorage.getItem(
                STORAGE_KEY_GUEST_SESSION_ID,
            ),
            expiresAt: this.browserStorage.getItem(
                STORAGE_KEY_GUEST_SESSION_EXPIRES_AT,
            ),
        });

        return this.sanitizeState({
            guestSession,
            userSession: sessionId ? { sessionId } : null,
            account:
                sessionId && accountId !== null
                    ? {
                          sessionId,
                          accountId,
                          username:
                              this.browserStorage.getItem(
                                  STORAGE_KEY_USERNAME,
                              ) || null,
                          avatarPath:
                              this.browserStorage.getItem(
                                  STORAGE_KEY_AVATAR_PATH,
                              ) || null,
                      }
                    : null,
            v4Access:
                v4AccessToken && v4AccountId
                    ? {
                          v4AccessToken,
                          v4AccountId,
                      }
                    : null,
        });
    }

    private parseAccountId(value: string | null): number | null {
        if (value === null) {
            return null;
        }

        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : null;
    }

    private sanitizeState(state: UserSessionState): UserSessionState {
        const guestSession = state.guestSession
            ? this.toValidGuestSession(state.guestSession)
            : null;
        const account =
            state.account && state.userSession
                ? {
                      ...state.account,
                      sessionId: state.userSession.sessionId,
                  }
                : null;

        return {
            guestSession,
            userSession: state.userSession,
            account,
            v4Access: state.v4Access,
        };
    }

    private toValidGuestSession(
        guestSession: GuestSessionSnapshot | {
            readonly guestSessionId: string | null;
            readonly expiresAt: string | null;
        },
    ): GuestSessionSnapshot | null {
        if (!guestSession.guestSessionId) {
            return null;
        }

        if (!this.isGuestSessionValid(guestSession.expiresAt)) {
            return null;
        }

        return {
            guestSessionId: guestSession.guestSessionId,
            expiresAt: guestSession.expiresAt,
        };
    }

    private isGuestSessionValid(expiresAt: string | null): boolean {
        if (!expiresAt) {
            return false;
        }

        const expirationTime = Date.parse(expiresAt);
        return Number.isFinite(expirationTime) && expirationTime > Date.now();
    }

    private toMode(state: UserSessionState): UserSessionMode {
        if (state.userSession) {
            return 'user';
        }

        if (state.guestSession) {
            return 'guest';
        }

        return 'anonymous';
    }
}
