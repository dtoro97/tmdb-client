import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, of, switchMap, tap } from 'rxjs';

import { PAGE_SIZE } from '../../../constants';
import { LoadableItems, LoadableValue, VideoTrailerSeedItem } from '../../../shared';
import {
    TrailerDataStoreService,
    TrailerFeedType,
    TrailerVideoCardItem,
} from '../trailer-data-store.service';

interface TrailersFeedState {
    readonly trailers: LoadableItems<TrailerVideoCardItem>;
    readonly pendingSeeds: readonly VideoTrailerSeedItem[];
}

interface TrailersPageState {
    readonly selectedFeed: TrailerFeedType;
    readonly featuredTrailer: LoadableValue<TrailerVideoCardItem | null>;
    readonly feeds: Record<TrailerFeedType, TrailersFeedState>;
}

const INITIAL_STATE: TrailersPageState = {
    selectedFeed: 'trending',
    featuredTrailer: { type: 'idle' },
    feeds: {
        trending: {
            trailers: { type: 'idle' },
            pendingSeeds: [],
        },
        new: {
            trailers: { type: 'idle' },
            pendingSeeds: [],
        },
    },
};

@Injectable()
export class TrailersPageStoreService extends ComponentStore<TrailersPageState> {
    readonly vm$ = this.select((state) => {
        const feed = state.feeds[state.selectedFeed];
        const items =
            feed.trailers.type === 'loaded' || feed.trailers.type === 'loading-more' ? feed.trailers.value : [];

        const featured = state.featuredTrailer.type === 'loaded' ? state.featuredTrailer.value : null;

        return {
            selectedFeed: state.selectedFeed,
            trailersState: feed.trailers,
            featuredSpotlight: featured
                ? {
                      spotlight: {
                          id: featured.mediaId,
                          mediaType: featured.mediaType,
                          title: featured.mediaTitle,
                          overview: featured.mediaOverview ?? '',
                          backdropPath: featured.backdropPath ?? null,
                          rating: null,
                          year: featured.mediaYear ?? '',
                          mediaTypeLabel: '',
                      },
                      videoUrl: featured.videoUrl,
                  }
                : null,
            showMore: feed.pendingSeeds.length > 0,
        };
    });

    constructor(private readonly trailerDataStore: TrailerDataStoreService) {
        super(INITIAL_STATE);
    }

    load$(feedType: TrailerFeedType = 'trending') {
        this.patchState({ selectedFeed: feedType });

        return forkJoin([
            this.loadFeaturedTrailer$(),
            this.loadFeed$(feedType),
        ]);
    }

    private loadFeaturedTrailer$() {
        const { featuredTrailer } = this.get();

        if (this.hasLoadedOrLoadingValue(featuredTrailer)) {
            return of([]);
        }

        this.patchState({
            featuredTrailer: { type: 'loading' },
        });

        return this.trailerDataStore.getTrailerSeeds$('trending').pipe(
            switchMap((trailerSeeds) =>
                this.trailerDataStore.loadVideoCardsForSeeds$(trailerSeeds.slice(0, 1)),
            ),
            tap((trailers) => {
                this.patchState({
                    featuredTrailer: {
                        type: 'loaded',
                        value: trailers[0] ?? null,
                    },
                });
            }),
        );
    }

    private loadFeed$(feedType: TrailerFeedType) {
        const feed = this.get().feeds[feedType];

        if (this.hasLoadedOrLoading(feed.trailers)) {
            return of([]);
        }

        this.patchFeedState(feedType, {
            trailers: { type: 'loading' },
            pendingSeeds: [],
        });

        return this.trailerDataStore.getTrailerSeeds$(feedType).pipe(
            switchMap((trailerSeeds) => {
                const initialSeeds = trailerSeeds.slice(0, PAGE_SIZE);

                return this.trailerDataStore.loadVideoCardsForSeeds$(initialSeeds).pipe(
                    tap((nextTrailers) => {
                        this.patchFeedState(feedType, {
                            trailers: {
                                type: 'loaded',
                                value: nextTrailers,
                            },
                            pendingSeeds: trailerSeeds.slice(initialSeeds.length),
                        });
                    }),
                );
            }),
        );
    }

    showMoreSelected$() {
        const state = this.get();
        const feedType = state.selectedFeed;
        const feed = state.feeds[feedType];

        if (feed.trailers.type !== 'loaded' || !feed.pendingSeeds.length) {
            return of([]);
        }

        const nextSeeds = feed.pendingSeeds.slice(0, PAGE_SIZE);
        const remainingSeeds = feed.pendingSeeds.slice(nextSeeds.length);
        const currentTrailers = feed.trailers.value;

        this.patchFeedState(feedType, {
            trailers: {
                type: 'loading-more',
                value: currentTrailers,
                placeholderCount: nextSeeds.length,
            } as LoadableItems<TrailerVideoCardItem>,
        });

        return this.trailerDataStore.loadVideoCardsForSeeds$(nextSeeds).pipe(
            tap((items) =>
                this.patchFeedState(feedType, {
                    trailers: {
                        type: 'loaded',
                        value: [...currentTrailers, ...items],
                    } as LoadableItems<TrailerVideoCardItem>,
                    pendingSeeds: remainingSeeds,
                }),
            ),
        );
    }

    private patchFeedState(feedType: TrailerFeedType, patch: Partial<TrailersFeedState>): void {
        this.patchState((state) => ({
            feeds: {
                ...state.feeds,
                [feedType]: {
                    ...state.feeds[feedType],
                    ...patch,
                },
            },
        }));
    }

    private hasLoadedOrLoading<T>(state: LoadableItems<T>): boolean {
        return state.type === 'loading' || state.type === 'loading-more' || state.type === 'loaded';
    }

    private hasLoadedOrLoadingValue<T>(state: LoadableValue<T>): boolean {
        return state.type === 'loading' || state.type === 'loaded';
    }
}
