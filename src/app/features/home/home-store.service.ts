import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, filter, forkJoin, map, of, switchMap, take, tap } from 'rxjs';

import {
    API_JSON_OPTIONS,
    DATE_WINDOW_DISCOVER_VOTE_COUNT_GTE,
    MEDIUM_LIST_COUNT,
    OPENING_SOON_MOVIE_DAYS_AHEAD,
    PAGE_SIZE,
    THEATRICAL_MOVIE_RELEASE_TYPE,
} from '../../constants';
import {
    DiscoverRestControllerService,
    MovieListRestControllerService,
    MultiListItem,
    PersonListRestControllerService,
    TrendingRestControllerService,
    TvSeriesListItem,
    TvSeriesListRestControllerService,
} from '../../api';
import {
    getCurrentMonthDateWindow,
    getCurrentMonthName,
    getISODate,
    LoadableItems,
    LoadableValue,
    LocaleStoreService,
    CardItem,
    MediaType,
    PersonCardItem,
    PillToggleOption,
    shuffle,
    toCardItem,
    toPersonCardItem,
} from '../../shared';
import { SpotlightItem } from './spotlight-item';
import { WatchProviderStoreService } from '../../shared/services';

type AiringTodayItem = CardItem<{
    year: string;
}>;

interface StreamingArrivalsFeature {
    readonly title: string;
    readonly description: string;
    readonly ctaLabel: string;
    readonly items: LoadableItems<CardItem>;
}

const TOP_PICKS_MAX_ITEMS = MEDIUM_LIST_COUNT;
const TOP_PICKS_FEATURED_COUNT = 3;

const WHAT_TO_WATCH_OPTIONS: PillToggleOption[] = [
    { label: 'Movies', value: 'movie' },
    { label: 'TV Shows', value: 'tv' },
];

interface HomeState {
    spotlight: LoadableValue<SpotlightItem | null>;
    whatToWatchMovies: LoadableItems<CardItem>;
    whatToWatchTv: LoadableItems<CardItem>;
    selectedWhatToWatchMediaType: MediaType;
    popularPeople: LoadableItems<PersonCardItem>;
    trendingToday: LoadableItems<CardItem>;
    airingToday: LoadableItems<AiringTodayItem>;
    streamingArrivals: LoadableItems<CardItem>;
    inTheatres: LoadableItems<CardItem>;
}

const INITIAL_STATE: HomeState = {
    spotlight: { type: 'loading' },
    whatToWatchMovies: { type: 'loading' },
    whatToWatchTv: { type: 'loading' },
    selectedWhatToWatchMediaType: 'movie',
    popularPeople: { type: 'loading' },
    trendingToday: { type: 'loading' },
    airingToday: { type: 'loading' },
    streamingArrivals: { type: 'loading' },
    inTheatres: { type: 'loading' },
};

@Injectable()
export class HomeStoreService extends ComponentStore<HomeState> {
    readonly homeVM$ = this.select((state) => ({
        spotlight: state.spotlight,
        whatToWatch:
            state.selectedWhatToWatchMediaType === 'movie'
                ? state.whatToWatchMovies
                : state.whatToWatchTv,
        whatToWatchLoading:
            (state.selectedWhatToWatchMediaType === 'movie'
                ? state.whatToWatchMovies
                : state.whatToWatchTv
            ).type === 'loading',
        whatToWatchTopPicks: this.toTopPickGroups(
            state.selectedWhatToWatchMediaType === 'movie'
                ? state.whatToWatchMovies
                : state.whatToWatchTv,
        ),
        whatToWatchOptions: WHAT_TO_WATCH_OPTIONS,
        selectedWhatToWatchMediaType: state.selectedWhatToWatchMediaType,
        popularPeople: state.popularPeople,
        trendingToday: state.trendingToday,
        airingToday: state.airingToday,
        airingTonightPreview:
            state.airingToday.type === 'loaded' ? state.airingToday.value.slice(0, 12) : [],
        streamingArrivals: this.toStreamingArrivalsFeature(state.streamingArrivals),
        inTheatres: state.inTheatres,
    }));

    private readonly opts = API_JSON_OPTIONS;

    constructor(
        private readonly tvListService: TvSeriesListRestControllerService,
        private readonly movieListService: MovieListRestControllerService,
        private readonly discoverService: DiscoverRestControllerService,
        private readonly personListService: PersonListRestControllerService,
        private readonly trendingService: TrendingRestControllerService,
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
            this.loadStreamingArrivals$(),
            this.loadInTheatres$(),
        ]);
    }

    setWhatToWatchMediaType(mediaType: MediaType): void {
        this.patchState({ selectedWhatToWatchMediaType: mediaType });
    }

    private loadWhatToWatch$() {
        this.patchState({
            whatToWatchMovies: { type: 'loading' },
            whatToWatchTv: { type: 'loading' },
        });

        return forkJoin({
            movies: this.movieListService
                .moviePopularList(
                    undefined,
                    1,
                    this.localeStore.region(),
                    'body',
                    undefined,
                    this.opts,
                )
                .pipe(
                    map((response) =>
                        (response.results ?? [])
                            .map((item) => toCardItem(item, 'movie'))
                            .slice(0, TOP_PICKS_MAX_ITEMS),
                    ),
                    catchError(() => of([] as CardItem[])),
                ),
            tv: this.tvListService
                .tvSeriesPopularList(undefined, 1, 'body', undefined, this.opts)
                .pipe(
                    map((response) =>
                        (response.results ?? [])
                            .map((item) => toCardItem(item, 'tv'))
                            .slice(0, TOP_PICKS_MAX_ITEMS),
                    ),
                    catchError(() => of([] as CardItem[])),
                ),
        }).pipe(
            tap((whatToWatch) =>
                this.patchState({
                    whatToWatchMovies: { type: 'loaded', value: whatToWatch.movies },
                    whatToWatchTv: { type: 'loaded', value: whatToWatch.tv },
                }),
            ),
        );
    }

    private loadPopularPeople$() {
        this.patchState({ popularPeople: { type: 'loading' } });

        return this.personListService.personPopularList(undefined, 1, 'body', undefined, this.opts).pipe(
            map((response) => (response.results ?? []).map((item) => toPersonCardItem(item)).slice(0, PAGE_SIZE)),
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

        return this.trendingService.trendingAll('day', undefined, 'body', undefined, this.opts).pipe(
            map((response) => {
                const mediaItems = (response.results ?? []).filter(
                    (item: MultiListItem) => item.media_type === 'movie' || item.media_type === 'tv',
                );

                const candidates = mediaItems.filter((item) => !!item.backdrop_path);
                const picked = shuffle(candidates)[0];
                const spotlight = picked ? this.toSpotlightItem(picked) : null;
                const carouselItems = mediaItems.filter((item) => item !== picked);

                return {
                    spotlight,
                    trendingToday: carouselItems
                        .map((item) =>
                            item.media_type === 'movie' ? toCardItem(item, 'movie') : toCardItem(item, 'tv'),
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

        const today = getISODate(0);

        return this.discoverService
            .discoverTv(
                today,
                today,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                'popularity.desc',
                this.getTimeZone(),
                undefined,
                undefined,
                DATE_WINDOW_DISCOVER_VOTE_COUNT_GTE,
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
                false,
                this.opts,
            )
            .pipe(
                map((response) =>
                    (response.results ?? [])
                        .map((item) => this.toAiringTodayItem(item))
                        .slice(0, PAGE_SIZE),
                ),
                catchError(() => of([] as AiringTodayItem[])),
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

    private loadStreamingArrivals$() {
        this.patchState({ streamingArrivals: { type: 'loading' } });

        const dateWindow = getCurrentMonthDateWindow();
        const region = this.localeStore.region() || 'US';

        return this.watchProviderStore.loaded$.pipe(
            filter(Boolean),
            take(1),
            switchMap(() => this.watchProviderStore.topTvProviders$.pipe(take(1))),
            switchMap((providers) => {
                const providerFilter = providers.map((provider) => provider.id).join('|') || undefined;

                return this.discoverService
                    .discoverTv(
                        dateWindow.from,
                        dateWindow.to,
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
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        region,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        'flatrate',
                        providerFilter,
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
                                .map((item) => toCardItem(item, 'tv'))
                                .filter((item) => !!item.imagePath)
                                .slice(0, 3),
                        ),
                        catchError(() => of([] as CardItem[])),
                    );
            }),
            tap((streamingArrivals) =>
                this.patchState({
                    streamingArrivals: {
                        type: 'loaded',
                        value: streamingArrivals,
                    },
                }),
            ),
        );
    }

    private loadInTheatres$() {
        this.patchState({ inTheatres: { type: 'loading' } });

        const releaseDateGte = getISODate(0);
        const releaseDateLte = getISODate(OPENING_SOON_MOVIE_DAYS_AHEAD);

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
                undefined,
                undefined,
                this.localeStore.region(),
                releaseDateGte,
                releaseDateLte,
                'primary_release_date.asc',
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
                THEATRICAL_MOVIE_RELEASE_TYPE,
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
                    (response.results ?? []).map((item) => toCardItem(item, 'movie')).slice(0, PAGE_SIZE),
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
            mediaTypeLabel: isMovie ? 'Movie' : 'TV Show',
        };
    }

    private toTopPickGroups(state: LoadableItems<CardItem>) {
        const topPickItems =
            state.type === 'loaded' || state.type === 'loading-more'
                ? state.value.slice(0, TOP_PICKS_MAX_ITEMS).map((item) => ({
                      item,
                  }))
                : [];

        return {
            featured: topPickItems.slice(0, TOP_PICKS_FEATURED_COUNT),
            secondary: topPickItems.slice(TOP_PICKS_FEATURED_COUNT),
        };
    }

    private toAiringTodayItem(item: TvSeriesListItem): AiringTodayItem {
        const cardItem = toCardItem(item, 'tv');

        return {
            ...cardItem,
            year: cardItem.date.slice(0, 4),
        };
    }

    private toStreamingArrivalsFeature(
        items: LoadableItems<CardItem>,
    ): StreamingArrivalsFeature {
        const month = getCurrentMonthName();

        return {
            title: `What's streaming in ${month}`,
            description:
                'Popular TV premieres and returning seasons from major streaming services.',
            ctaLabel: `Browse ${month} TV arrivals`,
            items,
        };
    }

    private getTimeZone(): string | undefined {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}
