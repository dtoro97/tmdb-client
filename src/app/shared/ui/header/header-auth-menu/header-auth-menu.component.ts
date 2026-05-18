import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import {
    EMPTY,
    BehaviorSubject,
    catchError,
    combineLatest,
    finalize,
    from,
    map,
    of,
    switchMap,
    take,
} from 'rxjs';

import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';
import { TmdbUserAccountService } from '../../../services/tmdb-user-account.service';
import { TmdbUserAuthService } from '../../../services/tmdb-user-auth.service';
import { UserSessionStoreService } from '../../../services/user-session-store.service';

interface HeaderAuthLink {
    readonly label: string;
    readonly route: string;
}

interface HeaderAuthMenuViewModel {
    readonly isAuthenticated: boolean;
    readonly displayName: string;
    readonly avatarPath: string | null;
    readonly loginPending: boolean;
    readonly logoutPending: boolean;
}

@Component({
    selector: 'app-header-auth-menu',
    imports: [
        AsyncPipe,
        MatDividerModule,
        MatMenuModule,
        RouterLink,
        UserAvatarComponent,
    ],
    templateUrl: './header-auth-menu.component.html',
    styleUrl: './header-auth-menu.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAuthMenuComponent {
    readonly accountLinks: ReadonlyArray<HeaderAuthLink> = [
        {
            label: 'Your profile',
            route: '/me',
        },
        {
            label: 'Your watchlists',
            route: '/me/watchlists',
        },
        {
            label: 'Your ratings',
            route: '/me/ratings',
        },
        {
            label: 'Your lists',
            route: '/me/lists',
        },
    ];
    private readonly pendingState$ = new BehaviorSubject({
        loginPending: false,
        logoutPending: false,
    });
    readonly vm$ = combineLatest([
        toObservable(this.userSessionStore.state),
        this.pendingState$,
    ]).pipe(
        map(([state, pendingState]): HeaderAuthMenuViewModel => {
            const displayName = state.username?.trim() || 'TMDb Member';

            return {
                isAuthenticated: !!state.sessionId,
                displayName,
                avatarPath: state.avatarPath,
                loginPending: pendingState.loginPending,
                logoutPending: pendingState.logoutPending,
            };
        }),
    );

    constructor(
        private readonly cdr: ChangeDetectorRef,
        private readonly destroyRef: DestroyRef,
        private readonly router: Router,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        if (
            this.userSessionStore.mode() === 'user' &&
            !this.userSessionStore.accountDetailsHydrated()
        ) {
            this.tmdbUserAccountService
                .hydrateUserSession$()
                .pipe(
                    take(1),
                    catchError(() => EMPTY),
                    takeUntilDestroyed(this.destroyRef),
                )
                .subscribe();
        }
    }

    startLogin(): void {
        const pendingState = this.pendingState$.value;

        if (pendingState.loginPending || pendingState.logoutPending) {
            return;
        }

        this.patchPendingState({ loginPending: true });

        this.tmdbUserAuthService
            .startLogin$(this.router.url)
            .pipe(
                catchError(() => EMPTY),
                finalize(() => this.patchPendingState({ loginPending: false })),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    signOut(): void {
        const pendingState = this.pendingState$.value;

        if (pendingState.logoutPending || pendingState.loginPending) {
            return;
        }

        this.patchPendingState({ logoutPending: true });

        this.tmdbUserAuthService
            .deleteUserSession$()
            .pipe(
                switchMap(() =>
                    this.router.url.startsWith('/me')
                        ? from(this.router.navigate(['/']))
                        : of(true),
                ),
                catchError(() => EMPTY),
                finalize(() =>
                    this.patchPendingState({ logoutPending: false }),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private patchPendingState(
        patch: Partial<{ loginPending: boolean; logoutPending: boolean }>,
    ): void {
        this.pendingState$.next({
            ...this.pendingState$.value,
            ...patch,
        });
        this.cdr.markForCheck();
    }
}
