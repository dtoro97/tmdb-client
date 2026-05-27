import { Injectable } from '@angular/core';

import { Observable, map, of, throwError } from 'rxjs';

import { AccountDetails, AccountRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { AccountSnapshot, UserAccountIdentity } from '../models';
import { toUserAccountIdentity, toUserAccountProfile } from '../mappers';
import { UserSessionStoreService } from './user-session-store.service';

@Injectable({ providedIn: 'root' })
export class TmdbUserAccountService {
    private readonly accountIdBootstrapPath = 'account_id' as unknown as number;

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    ensureAccount$(): Observable<AccountSnapshot> {
        if (!this.userSessionStore.isAuthenticated()) {
            return throwError(
                () => new Error('You need a user session to access account data.'),
            );
        }

        if (this.userSessionStore.hasAccount()) {
            return of(this.userSessionStore.requireAccount());
        }

        const { sessionId } = this.userSessionStore.requireUserSession();

        return this.loadAccount$(sessionId);
    }

    ensureAccountIdentity$(): Observable<UserAccountIdentity> {
        return this.ensureAccount$().pipe(
            map((account) => ({
                accountId: account.accountId,
                username: account.username,
            })),
        );
    }

    loadAccount$(
        sessionId?: string,
        v4AccessToken?: string | null,
        v4AccountId?: string | null,
    ): Observable<AccountSnapshot> {
        const resolvedSessionId =
            sessionId ?? this.userSessionStore.requireUserSession().sessionId;

        if (!resolvedSessionId) {
            return throwError(
                () =>
                    new Error(
                        'You need a user session to load account data.',
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
                    const snapshot: AccountSnapshot = {
                        sessionId: resolvedSessionId,
                        accountId: identity.accountId,
                        username: identity.username,
                        avatarPath: profile.avatarPath,
                    };

                    this.userSessionStore.setUserSession(resolvedSessionId);
                    this.userSessionStore.setAccount(snapshot);

                    if (v4AccessToken && v4AccountId) {
                        this.userSessionStore.setV4AccountAccess({
                            v4AccessToken,
                            v4AccountId,
                        });
                    }

                    return snapshot;
                }),
            );
    }

    getSessionAccountDetails$(): Observable<AccountDetails> {
        const { accountId, sessionId } = this.userSessionStore.requireAccount();

        return this.accountService.accountDetails(
            accountId,
            sessionId,
            'body',
            false,
            API_JSON_OPTIONS,
        );
    }
}
