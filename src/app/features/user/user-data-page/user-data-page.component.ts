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
import { UserListsStore } from '../user-lists-store.service';
import { UserProfileStore } from '../user-profile-store.service';
import { UserRatingsStore } from '../user-ratings-store.service';
import { UserWatchlistStore } from '../user-watchlist-store.service';
import { WatchlistSectionComponent } from '../watchlist-section/watchlist-section.component';

type UserDataSection = 'profile' | 'watchlists' | 'ratings' | 'lists';

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
            'Your TMDb account hub will live here, with profile details and shortcuts into your activity.',
        emptyStateTitle: 'Profile tools are coming here',
        emptyStateText:
            'We have the route in place so the new header menu can take you here cleanly. The account surface itself is the next step.',
        iconClass: 'fa-solid fa-user',
    },
    watchlists: {
        title: 'Your watchlists',
        description:
            'Keep track of the movies and shows you want to revisit, all from one personal watchlist view.',
        emptyStateTitle: 'Watchlists will appear here',
        emptyStateText:
            'This section is ready for the dedicated watchlist experience once the account pages are expanded.',
        iconClass: 'fa-solid fa-bookmark',
    },
    ratings: {
        title: 'Your ratings',
        description:
            'See the titles and episodes you have rated, with a focused view of your personal scoring history.',
        emptyStateTitle: 'Ratings history will appear here',
        emptyStateText:
            'The route is ready for the upcoming ratings page so the header menu can already point somewhere stable.',
        iconClass: 'fa-solid fa-star',
    },
    lists: {
        title: 'Your lists',
        description:
            'Custom TMDb lists will have their own space here, so you can jump back into the collections you curate.',
        emptyStateTitle: 'Custom lists will appear here',
        emptyStateText:
            'This route is set up for the future lists experience while we keep the header account menu fully wired.',
        iconClass: 'fa-solid fa-list',
    },
};

@Component({
    selector: 'app-user-data-page',
    imports: [
        EmptyStateComponent,
        UserDataOverviewSectionComponent,
        WatchlistSectionComponent,
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
                    this.userProfileStore.load$(),
                    this.userWatchlistStore.load$(
                        sessionId,
                        accountId,
                        language,
                    ),
                    this.userRatingsStore.load$(sessionId, accountId, language),
                    this.userListsStore.load$(sessionId, accountId, language),
                ]);
            }),
            map(() => undefined),
        );
    }
}
