import { AsyncPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
    EMPTY,
    Observable,
    catchError,
    combineLatest,
    defer,
    map,
    merge,
    switchMap,
} from 'rxjs';

import {
    EmptyStateComponent,
    LocaleStoreService,
    MediaCarouselPanelComponent,
    SkeletonComponent,
    SnackbarComponent,
    SnackbarService,
    SnackbarType,
    TmdbUserAccountService,
    UserAvatarComponent,
    RepeatPipe,
    isDefined,
} from '../../../shared';
import { UserListCardComponent } from '../user-list-card/user-list-card.component';
import { UserListCardSkeletonComponent } from '../user-list-card-skeleton/user-list-card-skeleton.component';
import { UserFavouritesStore } from '../user-favourites-store.service';
import { UserListsStore } from '../user-lists-store.service';
import { UserProfileStore } from '../user-profile-store.service';
import { UserRatingsStore } from '../user-ratings-store.service';
import { UserWatchlistStore } from '../user-watchlist-store.service';

@Component({
    selector: 'app-user-profile',
    imports: [
        AsyncPipe,
        SlicePipe,
        RouterLink,
        EmptyStateComponent,
        MediaCarouselPanelComponent,
        SkeletonComponent,
        UserAvatarComponent,
        UserListCardComponent,
        UserListCardSkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        UserFavouritesStore,
        UserProfileStore,
        UserRatingsStore,
        UserWatchlistStore,
    ],
})
export class UserProfileComponent {
    readonly previewCarouselColumns = 10;
    readonly previewPosterImageParams = 'w185';

    readonly vm$ = combineLatest([
        this.profileStore.userProfileVm$,
        this.favouritesStore.favouritesViewModel$,
        this.watchlistStore.watchlistViewModel$,
        this.ratingsStore.ratingsViewModel$,
        this.listsStore.listsViewModel$,
    ]).pipe(
        map(([profile, favourites, watchlist, ratings, lists]) => {
            const language = this.localeStore.language();
            const region = this.localeStore.region();

            return {
                ...profile,
                favourites,
                watchlist,
                ratings,
                lists,
                profileMeta: [
                    language ? `Language ${language.toUpperCase()}` : null,
                    region ? `Region ${region.toUpperCase()}` : null,
                ].filter(isDefined),
            };
        }),
    );

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly favouritesStore: UserFavouritesStore,
        private readonly listsStore: UserListsStore,
        private readonly localeStore: LocaleStoreService,
        private readonly profileStore: UserProfileStore,
        private readonly ratingsStore: UserRatingsStore,
        private readonly snackbar: SnackbarService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly watchlistStore: UserWatchlistStore,
    ) {
        this.tmdbUserAccountService
            .ensureAccountIdentity$()
            .pipe(
                switchMap(() =>
                    merge(
                        this.loadSection$(
                            () => this.profileStore.load$(),
                            'Could not load your profile summary.',
                        ),
                        this.loadSection$(
                            () => this.watchlistStore.load$(),
                            'Could not load your watchlist.',
                        ),
                        this.loadSection$(
                            () => this.ratingsStore.load$(),
                            'Could not load your ratings.',
                        ),
                        this.loadSection$(
                            () => this.favouritesStore.load$(),
                            'Could not load your favourites.',
                        ),
                        this.loadSection$(
                            () => this.listsStore.load$(),
                            'Could not load your lists.',
                        ),
                    ),
                ),
                catchError(() => this.showError('Could not load your profile.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private loadSection$(
        request: () => Observable<unknown>,
        errorMessage: string,
    ): Observable<unknown> {
        return defer(request).pipe(catchError(() => this.showError(errorMessage)));
    }

    private showError(message: string): Observable<never> {
        this.snackbar.openSnackbar(SnackbarComponent, {
            message,
            type: SnackbarType.Error,
        });

        return EMPTY;
    }
}
