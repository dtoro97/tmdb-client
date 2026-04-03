import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';

import {
    AuthenticationRestControllerService,
    SessionResponse,
    TokenResponse,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { buildRawBody } from '../utils/api-body';
import { TmdbUserAccountService } from './tmdb-user-account.service';
import { UserSessionStoreService } from './user-session-store.service';

function ensureRequestToken(tokenResponse: TokenResponse): string {
    const requestToken = tokenResponse.request_token?.trim();

    if (!requestToken) {
        throw new Error('TMDb did not return a request token.');
    }

    return requestToken;
}

function ensureSessionId(sessionResponse: SessionResponse): string {
    const sessionId = sessionResponse.session_id?.trim();

    if (!sessionId) {
        throw new Error('TMDb did not return a session id.');
    }

    return sessionId;
}

@Injectable({ providedIn: 'root' })
export class TmdbUserAuthService {
    constructor(
        private readonly authenticationService: AuthenticationRestControllerService,
        private readonly router: Router,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userSessionStore: UserSessionStoreService,
        @Inject(DOCUMENT) private readonly document: Document,
    ) {}

    ensureGuestSession$(): Observable<void> {
        if (this.userSessionStore.guestSessionId()) {
            return of(undefined);
        }

        return this.authenticationService
            .authenticationCreateGuestSession(
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((response) => {
                    const guestSessionId = response.guest_session_id?.trim();

                    if (!guestSessionId) {
                        throw new Error(
                            'TMDb did not return a guest session id.',
                        );
                    }

                    this.userSessionStore.setGuestSession(
                        guestSessionId,
                        response.expires_at ?? null,
                    );
                }),
                map(() => undefined),
            );
    }

    startLogin$(returnUrl: string): Observable<void> {
        return this.authenticationService
            .authenticationCreateRequestToken('body', false, API_JSON_OPTIONS)
            .pipe(
                tap((response) => {
                    const requestToken = ensureRequestToken(response);
                    this.navigateToTmdbApproval(requestToken, returnUrl);
                }),
                map(() => undefined),
            );
    }

    completeLoginFromCallback$(
        requestToken: string | null,
        approved: boolean,
    ): Observable<void> {
        if (!requestToken) {
            return throwError(
                () => new Error('The TMDb callback did not include a request token.'),
            );
        }

        if (!approved) {
            return throwError(
                () => new Error('TMDb login was cancelled or not approved.'),
            );
        }

        return this.authenticationService
            .authenticationCreateSession(
                buildRawBody({ request_token: requestToken }),
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                map((response) => ensureSessionId(response)),
                tap((sessionId) => {
                    this.userSessionStore.setUserSession(sessionId);
                }),
                switchMap((sessionId) =>
                    this.tmdbUserAccountService.hydrateUserSession$(sessionId),
                ),
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
                buildRawBody({ session_id: sessionId }),
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
        const requestToken = params.get('request_token');
        const approved = params.get('approved') === 'true';

        if (!requestToken || !approved) {
            return of(undefined);
        }

        return this.completeLoginFromCallback$(requestToken, approved).pipe(
            tap(() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('request_token');
                url.searchParams.delete('approved');
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }),
            catchError(() => of(undefined)),
        );
    }

    private navigateToTmdbApproval(requestToken: string, returnUrl: string): void {
        const redirectUrl = new URL(returnUrl, this.document.baseURI);
        const approvalUrl = new URL(
            `https://www.themoviedb.org/authenticate/${requestToken}`,
        );

        approvalUrl.searchParams.set('redirect_to', redirectUrl.toString());

        this.document.defaultView?.location.assign(approvalUrl.toString());
    }
}
