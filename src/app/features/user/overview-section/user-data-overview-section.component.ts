import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { combineLatest, map } from 'rxjs';

import {
    EmptyStateComponent,
    HeroSurfaceComponent,
    MediaCarouselPanelComponent,
    PageSectionComponent,
    RatingDistributionComponent,
    SkeletonComponent,
    UserAvatarComponent,
    RepeatPipe,
} from '../../../shared';
import { UserListCardComponent } from '../user-list-card/user-list-card.component';
import { UserListCardSkeletonComponent } from '../user-list-card-skeleton/user-list-card-skeleton.component';
import { UserListsStore } from '../user-lists-store.service';
import { UserProfileStore } from '../user-profile-store.service';
import { UserRatingsStore } from '../user-ratings-store.service';
import { UserWatchlistStore } from '../user-watchlist-store.service';

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
        UpperCasePipe,
    ],
    templateUrl: './user-data-overview-section.component.html',
    styleUrl: './user-data-overview-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDataOverviewSectionComponent {
    readonly vm$ = combineLatest([
        this.profileStore.userProfileVm$,
        this.watchlistStore.userWatchlistVm$,
        this.ratingsStore.userRatingsVm$,
        this.listsStore.vm$,
    ]).pipe(
        map(([profile, watchlist, ratings, lists]) => ({
            ...profile,
            watchlistTotal: watchlist.watchlistTotal,
            ratingsTotal: ratings.ratingsTotal,
            favoritesTotal: lists.favoritesTotal,
            listsTotal: lists.listsTotal,
            watchlistPreviewCards: watchlist.watchlistPreviewCards,
            favoritePreviewCards: lists.favoritePreviewCards,
            ratingPreviewCards: ratings.ratingPreviewCards,
            hasFavorites: lists.hasFavoriteMovies || lists.hasFavoriteTv,
            hasRatings: ratings.hasRatings,
            hasRatedEpisodes: ratings.episodes.hasItems,
            recentRatings: ratings.recentRatings,
            recentRatingsCount: ratings.recentRatingsCount,
            recentRatingsAverage: ratings.recentRatingsAverage,
            listPreviewState: lists.listPreviewState,
            hasLibraryContent:
                ((watchlist.movies.state.type === 'loaded' ||
                    watchlist.movies.state.type === 'loading-more') &&
                    watchlist.movies.state.value.length > 0) ||
                ((watchlist.tv.state.type === 'loaded' ||
                    watchlist.tv.state.type === 'loading-more') &&
                    watchlist.tv.state.value.length > 0) ||
                lists.hasFavoriteMovies ||
                lists.hasFavoriteTv ||
                lists.hasLists,
        })),
    );

    constructor(
        private readonly profileStore: UserProfileStore,
        private readonly watchlistStore: UserWatchlistStore,
        private readonly ratingsStore: UserRatingsStore,
        private readonly listsStore: UserListsStore,
    ) {}
}
