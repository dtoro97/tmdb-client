import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';

import { AccountAddFavoriteRequest, AuthenticationRestControllerService, SessionResponse } from '../../api';
import {
    AuthenticationService as AuthenticationV4Service,
    V4AccessTokenResponse,
    V4RequestTokenResponse,
} from '../../api-v4';
import { API_JSON_OPTIONS } from '../../constants';
import { BrowserStorageService } from './browser-storage.service';
import { TmdbUserAccountService } from './tmdb-user-account.service';
import { UserSessionStoreService } from './user-session-store.service';

const LAST_AUTH_ERROR_KEY = 'tmdb_last_auth_error';
const PENDING_V4_REQUEST_TOKEN_KEY = 'tmdb_pending_v4_request_token';
const PENDING_V4_REDIRECT_URL_KEY = 'tmdb_pending_v4_redirect_url';

@Injectable({ providedIn: 'root' })
export class TmdbUserAuthService {
    constructor(
        private readonly authenticationService: AuthenticationRestControllerService,
        private readonly authenticationV4Service: AuthenticationV4Service,
        private readonly browserStorage: BrowserStorageService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userSessionStore: UserSessionStoreService,
        @Inject(DOCUMENT) private readonly document: Document,
    ) {}

    ensureGuestSession$(): Observable<void> {
        if (this.userSessionStore.guestSessionId()) {
            return of(undefined);
        }

        return this.authenticationService.authenticationCreateGuestSession('body', false, API_JSON_OPTIONS).pipe(
            tap((response) => {
                const guestSessionId = response.guest_session_id?.trim();

                if (!guestSessionId) {
                    throw new Error('TMDb did not return a guest session id.');
                }

                this.userSessionStore.setGuestSession(guestSessionId, response.expires_at ?? null);
            }),
            map(() => undefined),
        );
    }

    startLogin$(returnUrl: string): Observable<void> {
        const redirectTo = new URL(`.${returnUrl}`, this.document.baseURI).toString();

        return this.authenticationV4Service
            .authenticationV4CreateRequestToken({ redirect_to: redirectTo }, 'body', false, API_JSON_OPTIONS)
            .pipe(
                tap((response) => {
                    const requestToken = this.ensureV4RequestToken(response);
                    this.storePendingLogin(requestToken, redirectTo);
                    this.navigateToTmdbApproval(requestToken);
                }),
                map(() => undefined),
            );
    }

    completeLoginFromCallback$(requestToken: string | null, approved: boolean): Observable<void> {
        if (!requestToken) {
            return throwError(() => new Error('The TMDb callback did not include a request token.'));
        }

        if (!approved) {
            return throwError(() => new Error('TMDb login was cancelled or not approved.'));
        }

        return this.authenticationV4Service
            .authenticationV4CreateAccessToken({ request_token: requestToken }, 'body', false, API_JSON_OPTIONS)
            .pipe(
                map((response) => ({
                    v4AccessToken: this.ensureV4AccessToken(response),
                    v4AccountId: this.ensureV4AccountId(response),
                })),
                switchMap(({ v4AccessToken, v4AccountId }) =>
                    this.authenticationService
                        .authenticationCreateSessionFromV4Token(
                            { access_token: v4AccessToken } as unknown as AccountAddFavoriteRequest,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        )
                        .pipe(
                            map((response) => this.ensureSessionId(response)),
                            map((sessionId) => ({
                                sessionId,
                                v4AccessToken,
                                v4AccountId,
                            })),
                        ),
                ),
                switchMap(({ sessionId, v4AccessToken, v4AccountId }) =>
                    this.tmdbUserAccountService.hydrateUserSession$(sessionId, v4AccessToken, v4AccountId),
                ),
                catchError((error) => {
                    this.userSessionStore.clearUserSession();
                    return throwError(() => error);
                }),
                map(() => undefined),
            );
    }

    deleteUserSession$(): Observable<void> {
        const sessionId = this.userSessionStore.sessionId();

        if (!sessionId) {
            this.userSessionStore.clearUserSession();
            return of(undefined);
        }

        return this.authenticationService
            .authenticationDeleteSession(
                { session_id: sessionId } as unknown as AccountAddFavoriteRequest,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                catchError(() => of(undefined)),
                finalize(() => {
                    this.userSessionStore.clearUserSession();
                }),
                map(() => undefined),
            );
    }

    tryCompleteLoginFromUrl$(): Observable<void> {
        const window = this.document.defaultView;

        if (!window) {
            return of(undefined);
        }

        const params = new URL(window.location.href).searchParams;
        const requestToken = params.get('request_token') ?? this.browserStorage.getItem(PENDING_V4_REQUEST_TOKEN_KEY);
        const approvedParam = params.get('approved');
        const pendingRedirectUrl = this.browserStorage.getItem(PENDING_V4_REDIRECT_URL_KEY);
        const isStoredCallbackReturn =
            !!requestToken &&
            !!pendingRedirectUrl &&
            this.isSameCallbackTarget(window.location.href, pendingRedirectUrl);

        if (!requestToken && !isStoredCallbackReturn) {
            return of(undefined);
        }

        if (approvedParam === 'false') {
            this.clearPendingLogin();
            return of(undefined);
        }

        return this.completeLoginFromCallback$(requestToken, true).pipe(
            tap(() => {
                this.clearPendingLogin();
                this.browserStorage.removeItem(LAST_AUTH_ERROR_KEY);
                const url = new URL(window.location.href);
                url.searchParams.delete('request_token');
                if (approvedParam !== null) {
                    url.searchParams.delete('approved');
                }
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }),
            catchError((error) => {
                this.clearPendingLogin();
                const message = error instanceof Error ? error.message : 'TMDb sign-in could not be completed.';
                this.browserStorage.setItem(LAST_AUTH_ERROR_KEY, message);
                return of(undefined);
            }),
        );
    }

    private navigateToTmdbApproval(requestToken: string): void {
        const approvalUrl = new URL('https://www.themoviedb.org/auth/access');

        approvalUrl.searchParams.set('request_token', requestToken);

        this.document.defaultView?.location.assign(approvalUrl.toString());
    }

    private storePendingLogin(requestToken: string, redirectUrl: string): void {
        this.browserStorage.writeItem(PENDING_V4_REQUEST_TOKEN_KEY, requestToken);
        this.browserStorage.writeItem(PENDING_V4_REDIRECT_URL_KEY, redirectUrl);
    }

    private clearPendingLogin(): void {
        this.browserStorage.removeItem(PENDING_V4_REQUEST_TOKEN_KEY);
        this.browserStorage.removeItem(PENDING_V4_REDIRECT_URL_KEY);
    }

    private ensureV4RequestToken(tokenResponse: V4RequestTokenResponse): string {
        const requestToken = tokenResponse.request_token?.trim();

        if (!requestToken) {
            throw new Error(tokenResponse.status_message || 'TMDb did not return a v4 request token.');
        }

        return requestToken;
    }

    private ensureV4AccessToken(tokenResponse: V4AccessTokenResponse): string {
        const accessToken = tokenResponse.access_token?.trim();

        if (!accessToken) {
            throw new Error(tokenResponse.status_message || 'TMDb did not return a v4 access token.');
        }

        return accessToken;
    }

    private ensureV4AccountId(tokenResponse: V4AccessTokenResponse): string {
        const accountId = tokenResponse.account_id?.trim();

        if (!accountId) {
            throw new Error('TMDb did not return a v4 account id.');
        }

        return accountId;
    }

    private ensureSessionId(sessionResponse: SessionResponse): string {
        const sessionId = sessionResponse.session_id?.trim();

        if (!sessionId) {
            throw new Error('TMDb did not return a session id.');
        }

        return sessionId;
    }

    private isSameCallbackTarget(currentUrl: string, pendingRedirectUrl: string): boolean {
        const current = new URL(currentUrl);
        const pending = new URL(pendingRedirectUrl, this.document.baseURI);

        return (
            current.origin === pending.origin && current.pathname === pending.pathname && current.hash === pending.hash
        );
    }
}
