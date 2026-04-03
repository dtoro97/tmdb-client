import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, map, of, switchMap, tap } from 'rxjs';

import { PAGE_SIZE } from '../../../constants';
import {
    LoadableItems,
    VideoCardItem,
    VideoTrailerSeedItem,
} from '../../../shared';
import type { SpotlightItem } from '../home-spotlight-models';
import { TrailerDataStoreService } from '../trailer-data-store.service';

interface TrailersPageState {
    readonly trailers: LoadableItems<VideoCardItem>;
    readonly pendingSeeds: readonly VideoTrailerSeedItem[];
}

interface FeaturedSpotlight {
    readonly spotlight: SpotlightItem;
    readonly videoUrl: string;
}

interface TrailersPageViewModel {
    readonly trailersState: LoadableItems<VideoCardItem>;
    readonly featuredSpotlight: FeaturedSpotlight | null;
    readonly showMore: boolean;
}

const INITIAL_STATE: TrailersPageState = {
    trailers: { type: 'idle' },
    pendingSeeds: [],
};

@Injectable()
export class TrailersPageStoreService extends ComponentStore<TrailersPageState> {
    readonly vm$ = this.select((state): TrailersPageViewModel => {
        const items =
            state.trailers.type === 'loaded' ||
            state.trailers.type === 'loading-more'
                ? state.trailers.value
                : [];

        const featured = items[0] ?? null;

        return {
            trailersState: state.trailers,
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
            showMore: state.pendingSeeds.length > 0,
        };
    });

    constructor(private readonly trailerDataStore: TrailerDataStoreService) {
        super(INITIAL_STATE);
    }

    load$(): Observable<void> {
        const { trailers } = this.get();

        if (this.hasLoadedOrLoading(trailers)) {
            return of(undefined);
        }

        this.patchState({
            trailers: { type: 'loading' },
            pendingSeeds: [],
        });

        return this.trailerDataStore.getTrendingTrailerSeeds$().pipe(
            switchMap((trendingSeeds) => {
                const initialSeeds = trendingSeeds.slice(0, PAGE_SIZE);

                return this.trailerDataStore
                    .loadVideoCardsForSeeds$(initialSeeds)
                    .pipe(
                        tap((nextTrailers) => {
                            this.patchState({
                                trailers: {
                                    type: 'loaded',
                                    value: nextTrailers,
                                },
                                pendingSeeds: trendingSeeds.slice(
                                    initialSeeds.length,
                                ),
                            });
                        }),
                        map(() => undefined),
                    );
            }),
        );
    }

    showMoreSelected$(): Observable<void> {
        const state = this.get();

        if (state.trailers.type !== 'loaded' || !state.pendingSeeds.length) {
            return of(undefined);
        }

        const nextSeeds = state.pendingSeeds.slice(0, PAGE_SIZE);
        const remainingSeeds = state.pendingSeeds.slice(nextSeeds.length);
        const currentTrailers = state.trailers.value;

        this.patchState({
            trailers: {
                type: 'loading-more',
                value: currentTrailers,
                placeholderCount: nextSeeds.length,
            } as LoadableItems<VideoCardItem>,
        });

        return this.trailerDataStore.loadVideoCardsForSeeds$(nextSeeds).pipe(
            tap((items) =>
                this.patchState({
                    trailers: {
                        type: 'loaded',
                        value: [...currentTrailers, ...items],
                    } as LoadableItems<VideoCardItem>,
                    pendingSeeds: remainingSeeds,
                }),
            ),
            map(() => undefined),
        );
    }

    private hasLoadedOrLoading<T>(state: LoadableItems<T>): boolean {
        return (
            state.type === 'loading' ||
            state.type === 'loading-more' ||
            state.type === 'loaded'
        );
    }
}
