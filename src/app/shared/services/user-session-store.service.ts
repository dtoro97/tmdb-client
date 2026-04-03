import { Injectable, computed, signal } from '@angular/core';

import { catchError, map, of, take } from 'rxjs';

import { AuthenticationRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { UserSessionMode, UserSessionState } from '../models';
import { BrowserStorageService } from './browser-storage.service';

const STORAGE_KEY_GUEST_SESSION_ID = 'tmdb_guest_session_id';
const STORAGE_KEY_GUEST_SESSION_EXPIRES_AT = 'tmdb_guest_session_expires_at';
const STORAGE_KEY_SESSION_ID = 'tmdb_user_session_id';
const STORAGE_KEY_ACCOUNT_ID = 'tmdb_user_account_id';
const STORAGE_KEY_USERNAME = 'tmdb_username';
const STORAGE_KEY_AVATAR_PATH = 'tmdb_avatar_path';
const STORAGE_KEY_ACCOUNT_DETAILS_HYDRATED = 'tmdb_account_details_hydrated';

const INITIAL_SESSION_STATE: UserSessionState = {
    guestSessionId: null,
    guestSessionExpiresAt: null,
    sessionId: null,
    accountId: null,
    username: null,
    avatarPath: null,
    accountDetailsHydrated: false,
};

@Injectable({ providedIn: 'root' })
export class UserSessionStoreService {
    readonly state;
    readonly mode = computed<UserSessionMode>(() => {
        const currentState = this.state();

        if (currentState.sessionId) {
            return 'user';
        }

        if (currentState.guestSessionId) {
            return 'guest';
        }

        return 'anonymous';
    });
    readonly canRate = computed(() => this.mode() !== 'anonymous');

    constructor(
        private readonly browserStorage: BrowserStorageService,
        private readonly authenticationService: AuthenticationRestControllerService,
    ) {
        this.state = signal<UserSessionState>(this.readInitialState());
        this.validatePersistedSession();
    }

    guestSessionId(): string | null {
        return this.state().guestSessionId;
    }

    sessionId(): string | null {
        return this.state().sessionId;
    }

    accountId(): number | null {
        return this.state().accountId;
    }

    username(): string | null {
        return this.state().username;
    }

    avatarPath(): string | null {
        return this.state().avatarPath;
    }

    accountDetailsHydrated(): boolean {
        return this.state().accountDetailsHydrated;
    }

    setGuestSession(guestSessionId: string, expiresAt: string | null): void {
        this.patchState(
            this.sanitizeState({
                ...this.state(),
                guestSessionId,
                guestSessionExpiresAt: expiresAt,
            }),
        );
    }

    setUserSession(
        sessionId: string,
        accountId: number | null = null,
        username: string | null = null,
        avatarPath: string | null = null,
        accountDetailsHydrated = false,
    ): void {
        this.patchState({
            guestSessionId: null,
            guestSessionExpiresAt: null,
            sessionId,
            accountId,
            username,
            avatarPath,
            accountDetailsHydrated,
        });
    }

    clearUserSession(): void {
        this.patchState({
            sessionId: null,
            accountId: null,
            username: null,
            avatarPath: null,
            accountDetailsHydrated: false,
        });
    }

    clearAllSessions(): void {
        this.patchState(INITIAL_SESSION_STATE);
    }

    private validatePersistedSession(): void {
        const sessionId = this.state().sessionId;

        if (!sessionId) {
            return;
        }

        this.authenticationService
            .authenticationValidateKey('body', false, API_JSON_OPTIONS)
            .pipe(
                take(1),
                catchError(() => {
                    this.clearUserSession();
                    return of(undefined);
                }),
                map(() => undefined),
            )
            .subscribe();
    }

    private patchState(patch: Partial<UserSessionState>): void {
        const nextState = this.sanitizeState({
            ...this.state(),
            ...patch,
        });

        this.state.set(nextState);
        this.syncToStorage(nextState);
    }

    private syncToStorage(state: UserSessionState): void {
        this.browserStorage.writeItem(
            STORAGE_KEY_GUEST_SESSION_ID,
            state.guestSessionId,
        );
        this.browserStorage.writeItem(
            STORAGE_KEY_GUEST_SESSION_EXPIRES_AT,
            state.guestSessionExpiresAt,
        );
        this.browserStorage.writeItem(STORAGE_KEY_SESSION_ID, state.sessionId);
        this.browserStorage.writeItem(
            STORAGE_KEY_ACCOUNT_ID,
            state.accountId !== null ? `${state.accountId}` : null,
        );
        this.browserStorage.writeItem(STORAGE_KEY_USERNAME, state.username);
        this.browserStorage.writeItem(STORAGE_KEY_AVATAR_PATH, state.avatarPath);
        this.browserStorage.writeItem(
            STORAGE_KEY_ACCOUNT_DETAILS_HYDRATED,
            state.accountDetailsHydrated ? 'true' : null,
        );
    }

    private readInitialState(): UserSessionState {
        const guestSessionId = this.browserStorage.getItem(
            STORAGE_KEY_GUEST_SESSION_ID,
        );
        const guestSessionExpiresAt = this.browserStorage.getItem(
            STORAGE_KEY_GUEST_SESSION_EXPIRES_AT,
        );

        return this.sanitizeState({
            guestSessionId,
            guestSessionExpiresAt,
            sessionId: this.browserStorage.getItem(STORAGE_KEY_SESSION_ID),
            accountId: this.parseAccountId(
                this.browserStorage.getItem(STORAGE_KEY_ACCOUNT_ID),
            ),
            username: this.browserStorage.getItem(STORAGE_KEY_USERNAME),
            avatarPath: this.browserStorage.getItem(STORAGE_KEY_AVATAR_PATH),
            accountDetailsHydrated:
                this.browserStorage.getItem(
                    STORAGE_KEY_ACCOUNT_DETAILS_HYDRATED,
                ) === 'true',
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
        const validGuestSession = this.isGuestSessionValid(
            state.guestSessionExpiresAt,
        );

        return {
            ...state,
            guestSessionId: validGuestSession ? state.guestSessionId : null,
            guestSessionExpiresAt: validGuestSession
                ? state.guestSessionExpiresAt
                : null,
        };
    }

    private isGuestSessionValid(expiresAt: string | null): boolean {
        if (!expiresAt) {
            return false;
        }

        const expirationTime = Date.parse(expiresAt);
        return Number.isFinite(expirationTime) && expirationTime > Date.now();
    }
}
