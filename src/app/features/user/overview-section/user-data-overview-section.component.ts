import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { combineLatest, map } from 'rxjs';

import {
    CardItem,
    EmptyStateComponent,
    HeroSurfaceComponent,
    LoadableItems,
    MediaCarouselPanelComponent,
    PageSectionComponent,
    RatingDistributionComponent,
    SkeletonComponent,
    UserAvatarComponent,
    RepeatPipe,
} from '../../../shared';
import { UserDataListItem, UserDataOverviewStat } from '../user-data.models';
import { UserListCardComponent } from '../user-list-card/user-list-card.component';
import { UserListCardSkeletonComponent } from '../user-list-card-skeleton/user-list-card-skeleton.component';
import { UserListsStore, UserListsVm } from '../user-lists-store.service';
import { UserProfileStore, UserProfileVm } from '../user-profile-store.service';
import { UserRatingsStore, UserRatingsVm } from '../user-ratings-store.service';
import {
    UserWatchlistStore,
    UserWatchlistVm,
} from '../user-watchlist-store.service';

interface OverviewVm extends UserProfileVm {
    readonly overviewStats: readonly UserDataOverviewStat[];
    readonly watchlistPreviewCards: LoadableItems<CardItem>;
    readonly favoritePreviewCards: LoadableItems<CardItem>;
    readonly ratingPreviewCards: LoadableItems<CardItem>;
    readonly hasFavorites: boolean;
    readonly hasRatings: boolean;
    readonly hasRatedEpisodes: boolean;
    readonly recentRatings: readonly number[];
    readonly recentRatingsCount: number;
    readonly recentRatingsAverage: number | null;
    readonly listPreviewState: LoadableItems<UserDataListItem>;
    readonly hasLibraryContent: boolean;
}

function toOverviewStats(
    watchlist: UserWatchlistVm,
    ratings: UserRatingsVm,
    lists: UserListsVm,
): readonly UserDataOverviewStat[] {
    return [
        {
            label: 'Ratings',
            value: ratings.ratingsTotal,
            route: '/me/ratings',
        },
        {
            label: 'Watchlist',
            value: watchlist.watchlistTotal,
            route: '/me/watchlists',
        },
        {
            label: 'Favorites',
            value: lists.favoritesTotal,
            route: '/me/favorites',
        },
        {
            label: 'Lists',
            value: lists.listsTotal,
            route: '/me/lists',
        },
    ];
}

@Component({
    selector: 'app-user-data-overview-section',
    imports: [
        AsyncPipe,
        RouterLink,
        EmptyStateComponent,
        HeroSurfaceComponent,
        MediaCarouselPanelComponent,
        PageSectionComponent,
        RatingDistributionComponent,
        SkeletonComponent,
        UserAvatarComponent,
        UserListCardComponent,
        UserListCardSkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './user-data-overview-section.component.html',
    styleUrl: './user-data-overview-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDataOverviewSectionComponent {
    readonly vm$ = combineLatest([
        this.profileStore.vm$,
        this.watchlistStore.vm$,
        this.ratingsStore.vm$,
        this.listsStore.vm$,
    ]).pipe(
        map(
            ([profile, watchlist, ratings, lists]): OverviewVm => ({
                ...profile,
                overviewStats: toOverviewStats(watchlist, ratings, lists),
                watchlistPreviewCards: watchlist.watchlistPreviewCards,
                favoritePreviewCards: lists.favoritePreviewCards,
                ratingPreviewCards: ratings.ratingPreviewCards,
                hasFavorites: lists.hasFavoriteMovies || lists.hasFavoriteTv,
                hasRatings: ratings.hasRatings,
                hasRatedEpisodes: ratings.hasRatedEpisodes,
                recentRatings: ratings.recentRatings,
                recentRatingsCount: ratings.recentRatingsCount,
                recentRatingsAverage: ratings.recentRatingsAverage,
                listPreviewState: lists.listPreviewState,
                hasLibraryContent:
                    watchlist.hasWatchlistMovies ||
                    watchlist.hasWatchlistTv ||
                    lists.hasFavoriteMovies ||
                    lists.hasFavoriteTv ||
                    lists.hasLists,
            }),
        ),
    );

    constructor(
        private readonly profileStore: UserProfileStore,
        private readonly watchlistStore: UserWatchlistStore,
        private readonly ratingsStore: UserRatingsStore,
        private readonly listsStore: UserListsStore,
    ) {}
}
