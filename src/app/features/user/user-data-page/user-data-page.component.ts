import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
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
    switchMap,
} from 'rxjs';

import {
    EmptyStateComponent,
    LocaleStoreService,
    TmdbUserAccountService,
    UserSessionStoreService,
    toUserFacingErrorMessage,
} from '../../../shared';
import { UserDataOverviewSectionComponent } from '../overview-section/user-data-overview-section.component';
import { RatingsSectionComponent } from '../ratings-section/ratings-section.component';
import { FavoritesSectionComponent } from '../favorites-section/favorites-section.component';
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

interface UserDataSectionContent {
    readonly title: string;
    readonly description: string;
    readonly emptyStateTitle: string;
    readonly emptyStateText: string;
    readonly iconClass: string;
}

const USER_DATA_SECTION_CONTENT: Record<
    UserDataSection,
    UserDataSectionContent
> = {
    profile: {
        title: 'Your profile',
        description:
            'Your account overview, watchlist, ratings, and lists.',
        emptyStateTitle: 'Your profile is on its way',
        emptyStateText:
            'Profile details and account settings will appear here soon.',
        iconClass: 'fa-solid fa-user',
    },
    watchlists: {
        title: 'Your watchlists',
        description: 'Movies and shows you want to watch later.',
        emptyStateTitle: 'No watchlist items yet',
        emptyStateText:
            'Browse titles and add them to your watchlist to see them here.',
        iconClass: 'fa-solid fa-bookmark',
    },
    favorites: {
        title: 'Your favorites',
        description: 'Movies and shows you marked as favorites.',
        emptyStateTitle: 'No favorites yet',
        emptyStateText:
            'Browse titles and mark a few as favorites to see them here.',
        iconClass: 'fa-solid fa-heart',
    },
    ratings: {
        title: 'Your ratings',
        description: 'Titles and episodes you have rated.',
        emptyStateTitle: 'No ratings yet',
        emptyStateText:
            'Rate a few titles to start building your personal scoring history.',
        iconClass: 'fa-solid fa-star',
    },
    lists: {
        title: 'Your lists',
        description:
            'Custom collections you have created on TMDb.',
        emptyStateTitle: 'No custom lists yet',
        emptyStateText:
            'Create a themed collection on TMDb and it will show up here.',
        iconClass: 'fa-solid fa-list',
    },
};

@Component({
    selector: 'app-user-data-page',
    imports: [
        EmptyStateComponent,
        UserDataOverviewSectionComponent,
        WatchlistSectionComponent,
        FavoritesSectionComponent,
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
    sectionContent =
        USER_DATA_SECTION_CONTENT[
            (this.route.snapshot.data['section'] as
                | UserDataSection
                | undefined) ?? 'profile'
        ];
    currentSection: UserDataSection =
        (this.route.snapshot.data['section'] as UserDataSection | undefined) ??
        'profile';

    constructor(
        private readonly cdr: ChangeDetectorRef,
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

        this.route.data
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                const section =
                    (data['section'] as UserDataSection | undefined) ??
                    'profile';
                this.currentSection = section;
                this.sectionContent = USER_DATA_SECTION_CONTENT[section];
                this.cdr.markForCheck();
            });
    }

    private loadAllStores$(): Observable<void> {
        const mode = this.userSessionStore.mode();

        if (mode !== 'user') {
            this.userProfileStore.load$().subscribe();
            return of(undefined);
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
