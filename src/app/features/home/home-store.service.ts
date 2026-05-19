import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    DiscoverRestControllerService,
    MultiListItem,
    PersonListRestControllerService,
    TrendingRestControllerService,
    TvSeriesListItem,
    TvSeriesListRestControllerService,
} from '../../api';
import {
    getISODate,
    LoadableItems,
    LoadableValue,
    LocaleStoreService,
    CardItem,
    PersonCardItem,
    shuffle,
    toCardItem,
    toPersonCardItem,
} from '../../shared';
import { SpotlightItem } from './spotlight-item';
import { TrailerDataStoreService } from './trailer-data-store.service';
import { WatchProviderStoreService } from '../../shared/services';

export interface StreamingProviderConfig {
    id: number;
    label: string;
}

const TOP_PICKS_MAX_ITEMS = 10;
const TOP_PICKS_FEATURED_COUNT = 3;

interface HomeState {
    spotlight: LoadableValue<SpotlightItem | null>;
    whatToWatch: LoadableItems<CardItem>;
    popularPeople: LoadableItems<PersonCardItem>;
    trendingToday: LoadableItems<CardItem>;
    airingToday: LoadableItems<CardItem>;
    selectedStreamingProviderId: number | null;
    streamingProviders: StreamingProviderConfig[];
    streamingByProviderId: Record<number, LoadableItems<CardItem>>;
    inTheatres: LoadableItems<CardItem>;
}

const INITIAL_STATE: HomeState = {
    spotlight: { type: 'loading' },
    whatToWatch: { type: 'loading' },
    popularPeople: { type: 'loading' },
    trendingToday: { type: 'loading' },
    airingToday: { type: 'loading' },
    selectedStreamingProviderId: null,
    streamingProviders: [],
    streamingByProviderId: {},
    inTheatres: { type: 'loading' },
};

@Injectable()
export class HomeStoreService extends ComponentStore<HomeState> {
    readonly homeVM$ = this.select((state) => ({
        spotlight: state.spotlight,
        whatToWatch: state.whatToWatch,
        whatToWatchLoading: state.whatToWatch.type === 'loading',
        whatToWatchTopPicks: this.toTopPickGroups(state.whatToWatch),
        popularPeople: state.popularPeople,
        trendingToday: state.trendingToday,
        airingToday: state.airingToday,
        airingTonightPreview:
            state.airingToday.type === 'loaded'
                ? state.airingToday.value.slice(0, 12)
                : [],
        selectedStreamingProviderId: state.selectedStreamingProviderId,
        selectedStreamingProviderLabel:
            state.streamingProviders.find(
                (provider) => provider.id === state.selectedStreamingProviderId,
            )?.label ?? null,
        streamingProviders: state.streamingProviders.map((p) => ({
            label: p.label,
            value: p.id,
        })),
        streamingNow:
            state.selectedStreamingProviderId !== null
                ? (state.streamingByProviderId[
                      state.selectedStreamingProviderId
                  ] ?? { type: 'idle' as const })
                : { type: 'idle' as const },
        inTheatres: state.inTheatres,
    }));

    private readonly opts = API_JSON_OPTIONS;

    constructor(
        private readonly tvListService: TvSeriesListRestControllerService,
        private readonly discoverService: DiscoverRestControllerService,
        private readonly personListService: PersonListRestControllerService,
        private readonly trendingService: TrendingRestControllerService,
        private readonly trailerDataStore: TrailerDataStoreService,
        private readonly localeStore: LocaleStoreService,
        private readonly watchProviderStore: WatchProviderStoreService,
    ) {
        super(INITIAL_STATE);
    }

    loadAllSections$() {
        return forkJoin([
            this.loadWhatToWatch$(),
            this.loadPopularPeople$(),
            this.loadTrendingToday$(),
            this.loadAiringToday$(),
            this.loadStreamingProviders$(),
            this.loadInTheatres$(),
        ]);
    }

    setStreamingProvider(providerId: number): void {
        this.patchState({ selectedStreamingProviderId: providerId });
    }

    private loadStreamingProviders$() {
        return this.watchProviderStore.topTvProviders$.pipe(
            switchMap((topProviders) => {
                if (!topProviders.length) {
                    return of([]);
                }

                const providers: StreamingProviderConfig[] = topProviders.map(
                    (p) => ({
                        id: p.id,
                        label: p.name,
                    }),
                );

                const loadingState = providers.reduce(
                    (acc, p) => ({
                        ...acc,
                        [p.id]: { type: 'loading' as const },
                    }),
                    {} as Record<number, LoadableItems<CardItem>>,
                );

                this.patchState({
                    streamingProviders: providers,
                    selectedStreamingProviderId: providers[0].id,
                    streamingByProviderId: loadingState,
                });

                return forkJoin(
                    providers.map((provider) =>
                        this.trailerDataStore
                            .discoverStreamingTvByProviderId$(provider.id)
                            .pipe(
                                map((response) => response.results ?? []),
                                catchError(() => of([] as TvSeriesListItem[])),
                            ),
                    ),
                ).pipe(
                    tap((streamingGroups) =>
                        this.patchState({
                            streamingByProviderId: providers.reduce(
                                (acc, provider, index) => {
                                    const results =
                                        streamingGroups[index] ?? [];
                                    return {
                                        ...acc,
                                        [provider.id]: {
                                            type: 'loaded' as const,
                                            value: results
                                                .map((item) =>
                                                    toCardItem(item, 'tv'),
                                                )
                                                .slice(0, PAGE_SIZE),
                                        },
                                    };
                                },
                                {} as Record<number, LoadableItems<CardItem>>,
                            ),
                        }),
                    ),
                );
            }),
        );
    }

    private loadWhatToWatch$() {
        this.patchState({ whatToWatch: { type: 'loading' } });

        const movieMinScore = 6.8;
        const movieMinVotes = 500;
        const tvMinScore = 7;
        const tvMinVotes = 200;

        return forkJoin({
            movie: this.discoverService.discoverMovie(
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                undefined,
                undefined,
                this.localeStore.region(),
                undefined,
                undefined,
                'popularity.desc',
                movieMinScore,
                undefined,
                movieMinVotes,
                undefined,
                this.localeStore.region(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                undefined,
                this.opts,
            ),
            tv: this.discoverService.discoverTv(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                'popularity.desc',
                undefined,
                tvMinScore,
                undefined,
                tvMinVotes,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                undefined,
                this.opts,
            ),
        }).pipe(
            map(({ movie, tv }) =>
                shuffle([
                    ...(movie.results ?? []).map((item) =>
                        toCardItem(item, 'movie'),
                    ),
                    ...(tv.results ?? []).map((item) => toCardItem(item, 'tv')),
                ]).slice(0, PAGE_SIZE),
            ),
            catchError(() => of([] as CardItem[])),
            tap((whatToWatch) =>
                this.patchState({
                    whatToWatch: { type: 'loaded', value: whatToWatch },
                }),
            ),
        );
    }

    private loadPopularPeople$() {
        this.patchState({ popularPeople: { type: 'loading' } });

        return this.personListService
            .personPopularList(undefined, 1, 'body', undefined, this.opts)
            .pipe(
                map((response) =>
                    (response.results ?? [])
                        .map((item) => toPersonCardItem(item))
                        .slice(0, PAGE_SIZE),
                ),
                catchError(() => of([] as PersonCardItem[])),
                tap((popularPeople) =>
                    this.patchState({
                        popularPeople: { type: 'loaded', value: popularPeople },
                    }),
                ),
            );
    }

    private loadTrendingToday$() {
        this.patchState({
            spotlight: { type: 'loading' },
            trendingToday: { type: 'loading' },
        });

        return this.trendingService
            .trendingAll('day', undefined, 'body', undefined, this.opts)
            .pipe(
                map((response) => {
                    const mediaItems = (response.results ?? []).filter(
                        (item: MultiListItem) =>
                            item.media_type === 'movie' ||
                            item.media_type === 'tv',
                    );

                    const candidates = mediaItems.filter(
                        (item) => !!item.backdrop_path,
                    );
                    const picked = shuffle(candidates)[0];
                    const spotlight = picked
                        ? this.toSpotlightItem(picked)
                        : null;
                    const carouselItems = mediaItems.filter(
                        (item) => item !== picked,
                    );

                    return {
                        spotlight,
                        trendingToday: carouselItems
                            .map((item) =>
                                item.media_type === 'movie'
                                    ? toCardItem(item, 'movie')
                                    : toCardItem(item, 'tv'),
                            )
                            .slice(0, PAGE_SIZE),
                    };
                }),
                catchError(() =>
                    of({
                        spotlight: null as SpotlightItem | null,
                        trendingToday: [] as CardItem[],
                    }),
                ),
                tap(({ spotlight, trendingToday }) =>
                    this.patchState({
                        spotlight: { type: 'loaded', value: spotlight },
                        trendingToday: {
                            type: 'loaded',
                            value: trendingToday,
                        },
                    }),
                ),
            );
    }

    private loadAiringToday$() {
        this.patchState({ airingToday: { type: 'loading' } });

        return this.tvListService
            .tvSeriesAiringTodayList(
                undefined,
                1,
                undefined,
                'body',
                undefined,
                this.opts,
            )
            .pipe(
                map((response) =>
                    (response.results ?? [])
                        .map((item) => toCardItem(item, 'tv'))
                        .slice(0, PAGE_SIZE),
                ),
                catchError(() => of([] as CardItem[])),
                tap((airingToday) =>
                    this.patchState({
                        airingToday: {
                            type: 'loaded',
                            value: airingToday,
                        },
                    }),
                ),
            );
    }

    private loadInTheatres$() {
        this.patchState({ inTheatres: { type: 'loading' } });

        const releaseDateGte = getISODate(0);
        const releaseDateLte = getISODate(14);

        return this.discoverService
            .discoverMovie(
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                releaseDateGte,
                releaseDateLte,
                this.localeStore.region(),
                undefined,
                undefined,
                'popularity.desc',
                undefined,
                undefined,
                undefined,
                undefined,
                this.localeStore.region(),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                3,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                undefined,
                this.opts,
            )
            .pipe(
                map((response) =>
                    (response.results ?? [])
                        .map((item) => toCardItem(item, 'movie'))
                        .slice(0, PAGE_SIZE),
                ),
                catchError(() => of([] as CardItem[])),
                tap((inTheatres) =>
                    this.patchState({
                        inTheatres: { type: 'loaded', value: inTheatres },
                    }),
                ),
            );
    }

    private toSpotlightItem(item: MultiListItem): SpotlightItem | null {
        if (!item.backdrop_path || !item.id) {
            return null;
        }

        const isMovie = item.media_type === 'movie';
        const title = isMovie ? item.title : item.name;
        const date = isMovie ? item.release_date : item.first_air_date;

        return {
            id: item.id,
            mediaType: isMovie ? 'movie' : 'tv',
            title: title ?? '',
            overview: item.overview ?? '',
            backdropPath: item.backdrop_path,
            rating: item.vote_average ?? null,
            year: (date ?? '').slice(0, 4),
            mediaTypeLabel: isMovie ? 'Movie' : 'TV Series',
        };
    }

    private toTopPickGroups(state: LoadableItems<CardItem>) {
        const rankedItems =
            state.type === 'loaded' || state.type === 'loading-more'
                ? state.value.slice(0, TOP_PICKS_MAX_ITEMS).map((item, index) => ({
                      item,
                      rank: index + 1,
                  }))
                : [];

        return {
            featured: rankedItems.slice(0, TOP_PICKS_FEATURED_COUNT),
            secondary: rankedItems.slice(TOP_PICKS_FEATURED_COUNT),
        };
    }
}
