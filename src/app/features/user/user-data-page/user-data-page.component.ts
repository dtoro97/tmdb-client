import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    EMPTY,
    catchError,
    forkJoin,
    map,
    Observable,
    of,
    startWith,
    switchMap,
} from 'rxjs';

import {
    LocaleStoreService,
    TmdbUserAccountService,
    UserSessionStoreService,
    toUserFacingErrorMessage,
} from '../../../shared';
import { UserDataOverviewSectionComponent } from '../overview-section/user-data-overview-section.component';
import { RatingsSectionComponent } from '../ratings-section/ratings-section.component';
import { FavoritesSectionComponent } from '../favorites-section/favorites-section.component';
import { ListsSectionComponent } from '../lists-section/lists-section.component';
import { UserListsStore } from '../user-lists-store.service';
import { UserProfileStore } from '../user-profile-store.service';
import { UserRatingsStore } from '../user-ratings-store.service';
import { UserWatchlistStore } from '../user-watchlist-store.service';
import { WatchlistSectionComponent } from '../watchlist-section/watchlist-section.component';

type UserDataSection =
    | 'profile'
    | 'watchlists'
    | 'favorites'
    | 'ratings'
    | 'lists';

@Component({
    selector: 'app-user-data-page',
    imports: [
        AsyncPipe,
        UserDataOverviewSectionComponent,
        WatchlistSectionComponent,
        FavoritesSectionComponent,
        ListsSectionComponent,
        RatingsSectionComponent,
    ],
    templateUrl: './user-data-page.component.html',
    styleUrl: './user-data-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        UserProfileStore,
        UserWatchlistStore,
        UserRatingsStore,
        UserListsStore,
    ],
})
export class UserDataPageComponent {
    readonly currentSection$ = this.route.data.pipe(
        map(
            (data) =>
                (data['section'] as UserDataSection | undefined) ?? 'profile',
        ),
        startWith(
            (this.route.snapshot.data['section'] as
                | UserDataSection
                | undefined) ?? 'profile',
        ),
    );

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly localeStore: LocaleStoreService,
        private readonly route: ActivatedRoute,
        private readonly snackBar: MatSnackBar,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userProfileStore: UserProfileStore,
        private readonly userWatchlistStore: UserWatchlistStore,
        private readonly userRatingsStore: UserRatingsStore,
        private readonly userListsStore: UserListsStore,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        this.loadAllStores$()
            .pipe(
                catchError((error) => {
                    this.snackBar.open(
                        toUserFacingErrorMessage(
                            error,
                            'Could not load your account data.',
                        ),
                        'Dismiss',
                        { duration: 5000, panelClass: 'snackbar-error' },
                    );
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private loadAllStores$(): Observable<void> {
        const mode = this.userSessionStore.mode();

        if (mode !== 'user') {
            return this.userProfileStore.load$();
        }

        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(({ accountId }) => {
                const sessionId = this.userSessionStore.sessionId()!;
                const language = this.localeStore.language();

                return forkJoin([
                    this.userProfileStore.load$().pipe(
                        catchError(() => of(undefined)),
                    ),
                    this.userWatchlistStore.load$(
                        sessionId,
                        accountId,
                        language,
                    ).pipe(catchError(() => of(undefined))),
                    this.userRatingsStore.load$(sessionId, accountId, language).pipe(
                        catchError(() => of(undefined)),
                    ),
                    this.userListsStore.load$(
                        sessionId,
                        accountId,
                        language,
                        !!this.userSessionStore.v4AccessToken(),
                    ).pipe(catchError(() => of(undefined))),
                ]);
            }),
            map(() => undefined),
        );
    }
}
