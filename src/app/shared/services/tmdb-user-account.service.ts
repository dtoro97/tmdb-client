import { Injectable } from '@angular/core';

import { Observable, map, of, throwError } from 'rxjs';

import { AccountDetails, AccountRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { UserAccountIdentity } from '../models';
import { toUserAccountIdentity, toUserAccountProfile } from '../mappers';
import { UserSessionStoreService } from './user-session-store.service';

@Injectable({ providedIn: 'root' })
export class TmdbUserAccountService {
    private readonly accountIdBootstrapPath = 'account_id' as unknown as number;

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    ensureAccountIdentity$(): Observable<UserAccountIdentity> {
        const sessionId = this.userSessionStore.sessionId();

        if (!sessionId) {
            return throwError(
                () =>
                    new Error(
                        'You need a TMDb user session to access account data.',
                    ),
            );
        }

        const accountId = this.userSessionStore.accountId();
        const username = this.userSessionStore.username();

        if (accountId !== null) {
            return of({
                accountId,
                username,
            });
        }

        return this.hydrateUserSession$(sessionId);
    }

    hydrateUserSession$(
        sessionId?: string,
        v4AccessToken?: string | null,
        v4AccountId?: string | null,
    ): Observable<UserAccountIdentity> {
        const resolvedSessionId =
            sessionId ?? this.userSessionStore.sessionId();

        if (!resolvedSessionId) {
            return throwError(
                () =>
                    new Error(
                        'You need a TMDb user session to hydrate account data.',
                    ),
            );
        }

        return this.accountService
            .accountDetails(
                this.accountIdBootstrapPath,
                resolvedSessionId,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                map((account) => {
                    const identity = toUserAccountIdentity(account);
                    const profile = toUserAccountProfile(account);
                    this.userSessionStore.setUserSession(
                        resolvedSessionId,
                        identity.accountId,
                        identity.username,
                        profile.avatarPath,
                        true,
                        v4AccessToken,
                        v4AccountId,
                    );

                    return identity;
                }),
            );
    }

    getSessionAccountDetails$(): Observable<AccountDetails> {
        const sessionId = this.userSessionStore.sessionId();
        const accountId = this.userSessionStore.accountId();

        if (!sessionId || accountId === null) {
            return throwError(
                () =>
                    new Error(
                        'You need a hydrated TMDb user session to load account details.',
                    ),
            );
        }

        return this.accountService.accountDetails(
            accountId,
            sessionId,
            'body',
            false,
            API_JSON_OPTIONS,
        );
    }
}
