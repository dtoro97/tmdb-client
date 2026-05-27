import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import {
    debounceTime,
    catchError,
    combineLatest,
    distinctUntilChanged,
    EMPTY,
    forkJoin,
    map,
    Observable,
    of,
    startWith,
    switchMap,
    tap,
} from 'rxjs';

import {
    CertificationRestControllerService,
    DiscoverRestControllerService,
    KeywordRestControllerService,
    PersonListRestControllerService,
    SearchRestControllerService,
    TrendingRestControllerService,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    getISODate,
    LoadableItems,
    MediaListItem,
    MediaType,
    MediaOrPersonType,
    PersonListItem,
    type SelectOption,
    SortDirection,
    toMediaListItem,
    toPersonListItem,
} from '../../shared';
import { ConfigStoreService, GenreService, LocaleStoreService, WatchProviderStoreService } from '../../shared/services';
import { parseListParams, parseNumberListParam, parseNumberParam } from '../../shared/utils';
import { KeywordChip } from './discover-filters/discover-filters.component';

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    popular_movie: {
        label: 'Movies',
        title: 'Popular Movies',
        subtitle: 'Movies ordered by popularity',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        voteCountGte: 500,
        voteAverageGte: 6,
    },
    top_rated_movie: {
        label: 'Movies',
        title: 'Top Rated Movies',
        subtitle: 'Movies ordered by rating',
        defaultSortField: 'vote_average',
        defaultSortDirection: 'desc',
        voteCountGte: 12000,
    },
    upcoming_movie: {
        label: 'Movies',
        title: 'Upcoming Movies',
        subtitle: 'Movies that are being released soon',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(60) }),
    },
    now_playing_movie: {
        label: 'Movies',
        title: 'Now Playing Movies',
        subtitle: 'Movies that are currently in theatres',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(-30), lte: getISODate(7) }),
    },
    popular_tv: {
        label: 'TV Shows',
        title: 'Popular TV Shows',
        subtitle: 'TV shows ordered by popularity',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        voteCountGte: 300,
        voteAverageGte: 6.5,
    },
    top_rated_tv: {
        label: 'TV Shows',
        title: 'Top Rated TV Shows',
        subtitle: 'TV shows ordered by rating',
        defaultSortField: 'vote_average',
        defaultSortDirection: 'desc',
        voteCountGte: 3500,
    },
    airing_today_tv: {
        label: 'TV Shows',
        title: 'TV Shows Airing Today',
        subtitle: 'TV shows that are airing today',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(0) }),
    },
    on_the_air_tv: {
        label: 'TV Shows',
        title: 'TV Shows On The Air',
        subtitle: 'TV shows that are currently on the air',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(7) }),
    },
    trending_person: {
        label: 'People',
        title: 'Trending People',
        subtitle: 'People trending today',
        defaultSortField: '',
        defaultSortDirection: 'desc',
    },
    popular_person: {
        label: 'People',
        title: 'Popular People',
        subtitle: 'People ordered by popularity',
        defaultSortField: '',
        defaultSortDirection: 'desc',
    },
};

export type BrowseCategory =
    | 'popular'
    | 'top_rated'
    | 'upcoming'
    | 'now_playing'
    | 'airing_today'
    | 'on_the_air'
    | 'trending';
export type BrowseMediaType = MediaOrPersonType;

export interface CategoryConfig {
    label: string;
    title: string;
    subtitle: string;
    defaultSortField: string;
    defaultSortDirection: SortDirection;
    voteCountGte?: number;
    voteAverageGte?: number;
    dateFn?: () => { gte?: string; lte?: string };
}

export type SortOption = SelectOption<string>;

type CategoryOption = SelectOption<BrowseCategory>;

interface ResultPaginationState {
    page: number;
    totalPages: number;
}

export interface BrowseParams {
    type: BrowseMediaType;
    category: BrowseCategory;
    sortField?: string;
    sortDirection?: SortDirection;
    keywords: string[];
    genreIds: number[];
    yearFrom: number | null;
    yearTo: number | null;
    minRating: number | null;
    voteCountMin: number | null;
    runtimeMin: number | null;
    runtimeMax: number | null;
    certifications: string[];
    originalLanguage: string | null;
    watchProviderIds: number[];
}

type DiscoverRequestIntent =
    | {
          kind: 'browse';
          params: BrowseParams;
      }
    | {
          kind: 'load-more';
      };

interface DiscoverState {
    type: BrowseMediaType;
    category: BrowseCategory;
    keywordIds: string[];
    genreIds: number[];
    yearFrom: number | null;
    yearTo: number | null;
    minRating: number | null;
    voteCountMin: number | null;
    runtimeMin: number | null;
    runtimeMax: number | null;
    certifications: string[];
    originalLanguage: string | null;
    watchProviderIds: number[];
    keywordSuggestions: KeywordChip[];
    selectedKeywords: KeywordChip[];
    sortField: string | null;
    sortDirection: SortDirection;
    pagination: ResultPaginationState;
    totalResults: number;
    resultsState: LoadableItems<MediaListItem | PersonListItem>;
}

const EMPTY_PAGINATION: ResultPaginationState = {
    page: 0,
    totalPages: 0,
};

const INITIAL_STATE: DiscoverState = {
    type: 'movie',
    category: 'popular',
    keywordIds: [],
    genreIds: [],
    yearFrom: null,
    yearTo: null,
    minRating: null,
    voteCountMin: null,
    runtimeMin: null,
    runtimeMax: null,
    certifications: [],
    originalLanguage: null,
    watchProviderIds: [],
    keywordSuggestions: [],
    selectedKeywords: [],
    sortField: 'popularity',
    sortDirection: 'desc',
    pagination: { ...EMPTY_PAGINATION },
    totalResults: 0,
    resultsState: { type: 'loading' },
};

export const MOVIE_SORT_OPTIONS: SortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'Release Date', value: 'primary_release_date' },
    { label: 'Title', value: 'title' },
    { label: 'Revenue', value: 'revenue' },
];

export const TV_SORT_OPTIONS: SortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'First Air Date', value: 'first_air_date' },
    { label: 'Name', value: 'name' },
];

const BROWSE_TYPE_CONFIG: Record<
    BrowseMediaType,
    {
        defaultCategory: BrowseCategory;
        categories: readonly CategoryOption[];
        sortOptions: readonly SortOption[];
    }
> = {
    movie: {
        defaultCategory: 'popular',
        categories: [
            { label: 'Popular', value: 'popular' },
            { label: 'Top Rated', value: 'top_rated' },
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Now Playing', value: 'now_playing' },
        ],
        sortOptions: MOVIE_SORT_OPTIONS,
    },
    tv: {
        defaultCategory: 'popular',
        categories: [
            { label: 'Popular', value: 'popular' },
            { label: 'Top Rated', value: 'top_rated' },
            { label: 'Airing Today', value: 'airing_today' },
            { label: 'On The Air', value: 'on_the_air' },
        ],
        sortOptions: TV_SORT_OPTIONS,
    },
    person: {
        defaultCategory: 'popular',
        categories: [
            { label: 'Trending', value: 'trending' },
            { label: 'Popular', value: 'popular' },
        ],
        sortOptions: [],
    },
};

@Injectable()
export class DiscoverStoreService extends ComponentStore<DiscoverState> {
    readonly discoverState$ = this.select((state) => state);
    readonly type$ = this.select((state) => state.type);

    readonly genreMap$ = this.type$.pipe(
        switchMap((type) => {
            if (type === 'movie') {
                return this.genreService.movieGenres$;
            }

            if (type === 'tv') {
                return this.genreService.tvGenres$;
            }

            return of(new Map<number, string>());
        }),
        startWith(new Map<number, string>()),
    );

    readonly languageOptions$ = this.configStore.languages$.pipe(
        map((languages) =>
            languages
                .filter((language) => !!language.iso_639_1)
                .map((language) => ({
                    value: language.iso_639_1!,
                    label: language.english_name ?? language.iso_639_1!,
                }))
                .sort((left, right) => left.label.localeCompare(right.label)),
        ),
    );

    readonly certificationOptions$ = this.type$.pipe(
        switchMap((type) => {
            if (type === 'person') {
                return of([] as string[]);
            }

            const region = this.localeStore.region() || 'US';
            const request$ =
                type === 'tv'
                    ? this.certificationService.certificationsTvList('body', false, API_JSON_OPTIONS)
                    : this.certificationService.certificationMovieList('body', false, API_JSON_OPTIONS);

            return request$.pipe(
                map((result) => {
                    const certs = result.certifications?.[region] ?? result.certifications?.['US'] ?? [];
                    return certs
                        .filter(
                            (
                                certification,
                            ): certification is typeof certification & {
                                certification: string;
                            } => !!certification.certification,
                        )
                        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
                        .map((certification) => certification.certification);
                }),
                catchError(() => of([] as string[])),
            );
        }),
    );

    readonly watchProviderOptions$ = this.type$.pipe(
        switchMap((type) => {
            if (type === 'person') {
                return of([] as { id: number; name: string }[]);
            }

            const providers$ =
                type === 'tv' ? this.watchProviderStore.tvProviders$ : this.watchProviderStore.movieProviders$;

            return providers$.pipe(
                map((providers) =>
                    providers.slice(0, 20).map((provider) => ({
                        id: provider.id,
                        name: provider.name,
                    })),
                ),
            );
        }),
        startWith([] as { id: number; name: string }[]),
    );

    readonly vm$ = combineLatest({
        state: this.discoverState$,
        genreMap: this.genreMap$,
        languageOptions: this.languageOptions$,
        watchProviderOptions: this.watchProviderOptions$,
        certificationOptions: this.certificationOptions$,
    }).pipe(
        map(({ state, genreMap, languageOptions, watchProviderOptions, certificationOptions }) => {
            const browsingPeople = state.type === 'person';
            const config = this.getCategoryConfig(state.category, state.type);
            const visibleCount = this.getVisibleCount(state.resultsState);
            const startIndex = state.sortDirection === 'asc' ? state.totalResults : 1;

            return {
                ...state,
                config,
                browsingPeople,
                categoryOptions: this.getCategoryOptions(state.type),
                sortOptions: this.getSortOptions(state.type),
                visibleCount,
                startIndex,
                hasMore:
                    !(state.type === 'person' && state.category === 'trending') &&
                    state.pagination.page < state.pagination.totalPages,
                mediaState: browsingPeople
                    ? ({
                          type: 'loaded',
                          value: [],
                      } as LoadableItems<MediaListItem>)
                    : (state.resultsState as LoadableItems<MediaListItem>),
                personState: browsingPeople
                    ? (state.resultsState as LoadableItems<PersonListItem>)
                    : ({
                          type: 'loaded',
                          value: [],
                      } as LoadableItems<PersonListItem>),
                genreMap,
                genreList: Array.from(genreMap.entries()).map(([id, name]) => ({ id, name })),
                languageOptions,
                watchProviderOptions,
                certificationOptions,
                activeFilterCount: this.getActiveFilterCount(state),
                ratingPlaceholder: config?.voteAverageGte ?? null,
                descendingFrom: state.sortDirection === 'asc' ? startIndex : null,
                showEmptyState: state.resultsState.type === 'loaded' && visibleCount === 0,
            };
        }),
    );

    private readonly requestEffect = this.effect<DiscoverRequestIntent>((intent$) =>
        intent$.pipe(
            switchMap((intent) => {
                if (intent.kind === 'browse') {
                    return this.handleBrowseRequest(intent.params);
                }

                return this.handleLoadMoreRequest();
            }),
        ),
    );

    private readonly syncSelectedKeywordsEffect = this.effect<readonly string[]>((keywordIds$) =>
        keywordIds$.pipe(
            switchMap((keywordIds) => {
                if (!keywordIds.length) {
                    this.patchState({
                        selectedKeywords: [],
                        keywordSuggestions: [],
                    });
                    return EMPTY;
                }

                return forkJoin(
                    keywordIds.map((keywordId) =>
                        this.keywordService
                            .keywordDetails(Number(keywordId), 'body', false, API_JSON_OPTIONS)
                            .pipe(catchError(() => of(null))),
                    ),
                ).pipe(
                    tap((keywords) => {
                        this.patchState({
                            selectedKeywords: keywords
                                .filter(
                                    (
                                        keyword,
                                    ): keyword is {
                                        id: number;
                                        name: string;
                                    } => typeof keyword?.id === 'number' && typeof keyword?.name === 'string',
                                )
                                .map((keyword) => ({
                                    id: keyword.id,
                                    name: keyword.name,
                                })),
                        });
                    }),
                    catchError(() => {
                        this.patchState({ selectedKeywords: [] });
                        return EMPTY;
                    }),
                );
            }),
        ),
    );

    private readonly searchKeywordsEffect = this.effect<string>((query$) =>
        query$.pipe(
            map((query) => query.trim()),
            debounceTime(250),
            distinctUntilChanged(),
            switchMap((query) => {
                if (query.length < 2) {
                    this.patchState({ keywordSuggestions: [] });
                    return EMPTY;
                }

                return this.searchService.searchKeyword(query, 1, 'body', false, API_JSON_OPTIONS).pipe(
                    tap((result) => {
                        const selectedKeywordIds = new Set(this.get().selectedKeywords.map((keyword) => keyword.id));

                        this.patchState({
                            keywordSuggestions: (result.results ?? [])
                                .filter(
                                    (
                                        keyword,
                                    ): keyword is {
                                        id: number;
                                        name: string;
                                    } =>
                                        typeof keyword.id === 'number' &&
                                        typeof keyword.name === 'string' &&
                                        !selectedKeywordIds.has(keyword.id),
                                )
                                .map((keyword) => ({
                                    id: keyword.id,
                                    name: keyword.name,
                                })),
                        });
                    }),
                    catchError(() => {
                        this.patchState({ keywordSuggestions: [] });
                        return EMPTY;
                    }),
                );
            }),
        ),
    );

    constructor(
        private readonly discoverService: DiscoverRestControllerService,
        private readonly personListRestControllerService: PersonListRestControllerService,
        private readonly trendingService: TrendingRestControllerService,
        private readonly certificationService: CertificationRestControllerService,
        private readonly searchService: SearchRestControllerService,
        private readonly keywordService: KeywordRestControllerService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly titleService: Title,
        private readonly genreService: GenreService,
        private readonly configStore: ConfigStoreService,
        private readonly watchProviderStore: WatchProviderStoreService,
        private readonly localeStore: LocaleStoreService,
    ) {
        super(INITIAL_STATE);
    }

    applyQueryParams(params: ParamMap): void {
        const query = params.get('query');
        if (query) {
            const searchType = this.normalizeSearchType(params.get('type'));
            const queryParams: Record<string, string> = { query };

            if (searchType !== 'all') {
                queryParams['type'] = searchType;
            }

            this.router.navigate(['/search'], {
                queryParams,
                replaceUrl: true,
            });
            return;
        }

        const nextParams = this.parseBrowseParams(params);
        const canonicalParams = this.buildCanonicalParams(nextParams);

        if (this.shouldReplaceParams(params, canonicalParams)) {
            this.router.navigate([], {
                relativeTo: this.activatedRoute,
                queryParams: canonicalParams,
                replaceUrl: true,
            });
            return;
        }

        const config = this.getCategoryConfig(nextParams.category, nextParams.type);
        if (config) {
            this.titleService.setTitle(config.title);
        }

        this.syncSelectedKeywordsEffect(nextParams.keywords);
        this.requestEffect({
            kind: 'browse',
            params: nextParams,
        });
    }

    loadMore(): void {
        this.requestEffect({ kind: 'load-more' });
    }

    setCategory(category: string): void {
        const state = this.get();
        this.navigateWithQueryState({
            category: this.normalizeCategory(category, state.type),
            sortField: undefined,
            sortDirection: undefined,
        });
    }

    setSort(sortField: string): void {
        this.navigateWithQueryState({ sortField });
    }

    toggleSortDirection(): void {
        const state = this.get();
        if (state.type === 'person' || !state.sortField) {
            return;
        }

        this.navigateWithQueryState({
            sortDirection: state.sortDirection === 'desc' ? 'asc' : 'desc',
        });
    }

    toggleGenre(genreId: number): void {
        const state = this.get();
        if (state.type === 'person') {
            return;
        }

        const genreIds = state.genreIds.includes(genreId)
            ? state.genreIds.filter((id) => id !== genreId)
            : [...state.genreIds, genreId];

        this.navigateWithQueryState({ genreIds });
    }

    searchKeywords(query: string): void {
        this.searchKeywordsEffect(query);
    }

    addKeyword(keyword: KeywordChip): void {
        const state = this.get();
        const keywordId = `${keyword.id}`;
        if (state.keywordIds.includes(keywordId)) {
            return;
        }

        this.patchState({
            selectedKeywords: [...state.selectedKeywords, keyword],
            keywordSuggestions: [],
        });
        this.navigateWithQueryState({
            keywords: [...state.keywordIds, keywordId],
        });
    }

    removeKeyword(keywordId: number): void {
        const state = this.get();
        this.patchState({
            selectedKeywords: state.selectedKeywords.filter((keyword) => keyword.id !== keywordId),
        });
        this.navigateWithQueryState({
            keywords: state.keywordIds.filter((id) => id !== `${keywordId}`),
        });
    }

    setYearRange(yearFrom: number | null, yearTo: number | null): void {
        this.navigateWithQueryState({ yearFrom, yearTo });
    }

    setMinRating(minRating: number | null): void {
        this.navigateWithQueryState({ minRating });
    }

    setVoteCount(voteCountMin: number | null): void {
        this.navigateWithQueryState({ voteCountMin });
    }

    setRuntime(runtimeMin: number | null, runtimeMax: number | null): void {
        this.navigateWithQueryState({ runtimeMin, runtimeMax });
    }

    toggleCertification(cert: string): void {
        const state = this.get();
        if (state.type === 'person') {
            return;
        }

        const certifications = state.certifications.includes(cert)
            ? state.certifications.filter((current) => current !== cert)
            : [...state.certifications, cert];

        this.navigateWithQueryState({ certifications });
    }

    setLanguage(language: string | null): void {
        this.navigateWithQueryState({ originalLanguage: language });
    }

    toggleWatchProvider(providerId: number): void {
        const state = this.get();
        if (state.type === 'person') {
            return;
        }

        const watchProviderIds = state.watchProviderIds.includes(providerId)
            ? state.watchProviderIds.filter((id) => id !== providerId)
            : [...state.watchProviderIds, providerId];

        this.navigateWithQueryState({ watchProviderIds });
    }

    clearFilters(): void {
        this.patchState({
            keywordSuggestions: [],
            selectedKeywords: [],
        });
        this.navigateWithQueryState({
            keywords: [],
            genreIds: [],
            yearFrom: null,
            yearTo: null,
            minRating: null,
            voteCountMin: null,
            runtimeMin: null,
            runtimeMax: null,
            certifications: [],
            originalLanguage: null,
            watchProviderIds: [],
        });
    }

    private navigateWithQueryState(overrides: Partial<BrowseParams>): void {
        const state = this.get();
        const nextState: BrowseParams = {
            type: state.type,
            category: state.category,
            sortField: state.sortField ?? undefined,
            sortDirection: state.type === 'person' ? undefined : state.sortDirection,
            keywords: state.keywordIds,
            genreIds: state.genreIds,
            yearFrom: state.yearFrom,
            yearTo: state.yearTo,
            minRating: state.minRating,
            voteCountMin: state.voteCountMin,
            runtimeMin: state.runtimeMin,
            runtimeMax: state.runtimeMax,
            certifications: state.certifications,
            originalLanguage: state.originalLanguage,
            watchProviderIds: state.watchProviderIds,
            ...overrides,
        };

        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: this.buildCanonicalParams(nextState),
        });
    }

    private parseBrowseParams(params: ParamMap): BrowseParams {
        const type = this.normalizeBrowseType(params.get('type'));

        return {
            type,
            category: this.normalizeCategory(params.get('category'), type),
            sortField: params.get('sortField') || undefined,
            sortDirection: this.normalizeSortDirection(params.get('sortDirection')),
            keywords: type === 'person' ? [] : parseListParams(params.get('keywords')),
            genreIds: type === 'person' ? [] : parseNumberListParam(params.get('genres'), 'int'),
            yearFrom: parseNumberParam(params.get('yearFrom'), 'int'),
            yearTo: parseNumberParam(params.get('yearTo'), 'int'),
            minRating: parseNumberParam(params.get('rating'), 'float'),
            voteCountMin: parseNumberParam(params.get('voteCount'), 'float'),
            runtimeMin: parseNumberParam(params.get('runtimeMin'), 'float'),
            runtimeMax: parseNumberParam(params.get('runtimeMax'), 'float'),
            certifications: type === 'person' ? [] : parseListParams(params.get('certification')),
            originalLanguage: type === 'person' ? null : params.get('language') || null,
            watchProviderIds: type === 'person' ? [] : parseNumberListParam(params.get('providers'), 'int'),
        };
    }

    private buildCanonicalParams(params: BrowseParams): Record<string, string> {
        const queryParams: Record<string, string> = {
            type: params.type,
            category: params.category,
        };
        const config = this.getCategoryConfig(params.category, params.type);

        if (params.type !== 'person') {
            if (params.sortField && params.sortField !== config?.defaultSortField) {
                queryParams['sortField'] = params.sortField;
            }

            if (params.sortDirection && params.sortDirection !== config?.defaultSortDirection) {
                queryParams['sortDirection'] = params.sortDirection;
            }

            if (params.keywords.length) {
                queryParams['keywords'] = params.keywords.join(',');
            }

            if (params.genreIds.length) {
                queryParams['genres'] = params.genreIds.join(',');
            }

            if (params.yearFrom !== null) {
                queryParams['yearFrom'] = `${params.yearFrom}`;
            }

            if (params.yearTo !== null) {
                queryParams['yearTo'] = `${params.yearTo}`;
            }

            if (params.minRating !== null) {
                queryParams['rating'] = `${params.minRating}`;
            }

            if (params.voteCountMin !== null && params.voteCountMin > 0) {
                queryParams['voteCount'] = `${params.voteCountMin}`;
            }

            if (params.runtimeMin !== null) {
                queryParams['runtimeMin'] = `${params.runtimeMin}`;
            }

            if (params.runtimeMax !== null) {
                queryParams['runtimeMax'] = `${params.runtimeMax}`;
            }

            if (params.certifications.length) {
                queryParams['certification'] = params.certifications.join(',');
            }

            if (params.originalLanguage) {
                queryParams['language'] = params.originalLanguage;
            }

            if (params.watchProviderIds.length) {
                queryParams['providers'] = params.watchProviderIds.join(',');
            }
        }

        return queryParams;
    }

    private shouldReplaceParams(params: ParamMap, canonicalParams: Record<string, string>): boolean {
        const keys = [
            'type',
            'category',
            'sortField',
            'sortDirection',
            'keywords',
            'genres',
            'yearFrom',
            'yearTo',
            'rating',
            'voteCount',
            'runtimeMin',
            'runtimeMax',
            'certification',
            'language',
            'providers',
        ];

        return keys.some((key) => (params.get(key) ?? undefined) !== canonicalParams[key]);
    }

    private fetchBrowseMedia$(
        type: MediaType,
        sortBy: string,
        page: number,
        config: CategoryConfig,
        keywordIds: string[],
        genreIds: number[] = [],
        yearFrom: number | null = null,
        yearTo: number | null = null,
        minRating: number | null = null,
        voteCountMin: number | null = null,
        runtimeMin: number | null = null,
        runtimeMax: number | null = null,
        certifications: string[] = [],
        originalLanguage: string | null = null,
        watchProviderIds: number[] = [],
    ): Observable<void> {
        const categoryDates = config.dateFn ? config.dateFn() : {};
        const keywordFilter = keywordIds.length ? keywordIds.join(',') : undefined;
        const genreFilter = genreIds.length ? genreIds.join(',') : undefined;
        const dateGte = categoryDates.gte ?? (yearFrom ? `${yearFrom}-01-01` : undefined);
        const dateLte = categoryDates.lte ?? (yearTo ? `${yearTo}-12-31` : undefined);
        const voteAverageGte = minRating ?? config.voteAverageGte;
        const voteCountGte =
            minRating !== null && minRating > 0 ? Math.max(config.voteCountGte ?? 1, 50) : (config.voteCountGte ?? 1);
        const effectiveVoteCountGte = voteCountMin !== null && voteCountMin > 0 ? voteCountMin : voteCountGte;
        const certificationFilter = certifications.length ? certifications.join('|') : undefined;
        const certificationCountry = certifications.length ? this.localeStore.region() || 'US' : undefined;
        const watchProviderFilter = watchProviderIds.length ? watchProviderIds.join('|') : undefined;
        const watchRegion = watchProviderIds.length ? this.localeStore.region() || 'US' : undefined;

        if (type === 'movie') {
            return this.discoverService
                .discoverMovie(
                    certificationFilter,
                    undefined,
                    undefined,
                    certificationCountry,
                    false,
                    undefined,
                    undefined,
                    page,
                    undefined,
                    dateGte,
                    dateLte,
                    undefined,
                    undefined,
                    undefined,
                    sortBy as 'popularity.desc',
                    voteAverageGte,
                    undefined,
                    effectiveVoteCountGte,
                    undefined,
                    watchRegion,
                    undefined,
                    undefined,
                    undefined,
                    genreFilter,
                    keywordFilter,
                    undefined,
                    originalLanguage ?? undefined,
                    undefined,
                    undefined,
                    runtimeMin ?? undefined,
                    runtimeMax ?? undefined,
                    undefined,
                    watchProviderFilter,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'body',
                    false,
                    API_JSON_OPTIONS,
                )
                .pipe(
                    map((result) => {
                        const mapped = (result.results ?? []).map((item) => toMediaListItem(item, 'movie', 'year'));
                        this.patchLoadedResults(page, mapped, result.page, result.total_pages, result.total_results);
                        return undefined;
                    }),
                    catchError(() => this.handleResultsError()),
                );
        }

        return this.discoverService
            .discoverTv(
                undefined,
                undefined,
                undefined,
                dateGte,
                dateLte,
                false,
                undefined,
                undefined,
                page,
                undefined,
                sortBy as 'popularity.desc',
                undefined,
                voteAverageGte,
                undefined,
                effectiveVoteCountGte,
                undefined,
                watchRegion,
                undefined,
                genreFilter,
                keywordFilter,
                undefined,
                undefined,
                originalLanguage ?? undefined,
                runtimeMin ?? undefined,
                runtimeMax ?? undefined,
                undefined,
                undefined,
                watchProviderFilter,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                map((result) => {
                    const mapped = (result.results ?? []).map((item) => toMediaListItem(item, 'tv', 'year'));
                    this.patchLoadedResults(page, mapped, result.page, result.total_pages, result.total_results);
                    return undefined;
                }),
                catchError(() => this.handleResultsError()),
            );
    }

    private fetchBrowsePeople$(category: BrowseCategory, page: number): Observable<void> {
        if (category === 'trending') {
            return this.trendingService.trendingPeople('day', undefined, 'body', false, API_JSON_OPTIONS).pipe(
                map((result) => {
                    const mapped = (result.results ?? []).map((item) => toPersonListItem(item));
                    this.patchLoadedResults(1, mapped, 1, 1, result.total_results ?? mapped.length);
                    return undefined;
                }),
                catchError(() => this.handleResultsError()),
            );
        }

        return this.personListRestControllerService
            .personPopularList(undefined, page, undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                map((result) => {
                    const mapped = (result.results ?? []).map((item) => toPersonListItem(item));
                    this.patchLoadedResults(page, mapped, result.page, result.total_pages, result.total_results);
                    return undefined;
                }),
                catchError(() => this.handleResultsError()),
            );
    }

    private handleBrowseRequest(params: BrowseParams): Observable<void> {
        const normalizedCategory = this.normalizeCategory(params.category, params.type);
        const config = this.getCategoryConfig(normalizedCategory, params.type);

        if (!config) {
            this.router.navigate(['/discover'], {
                queryParams: { type: 'movie', category: 'popular' },
                replaceUrl: true,
            });
            return EMPTY;
        }

        const nextSortField = params.type === 'person' ? null : (params.sortField ?? config.defaultSortField);
        const nextSortDirection = params.sortDirection ?? config.defaultSortDirection;

        this.patchState({
            type: params.type,
            category: normalizedCategory,
            keywordIds: params.keywords,
            genreIds: params.genreIds,
            yearFrom: params.yearFrom,
            yearTo: params.yearTo,
            minRating: params.minRating,
            voteCountMin: params.voteCountMin,
            runtimeMin: params.runtimeMin,
            runtimeMax: params.runtimeMax,
            certifications: params.certifications,
            originalLanguage: params.originalLanguage,
            watchProviderIds: params.watchProviderIds,
            sortField: nextSortField,
            sortDirection: nextSortDirection,
            pagination: { ...EMPTY_PAGINATION },
            totalResults: 0,
            resultsState: { type: 'loading' },
        });

        if (params.type === 'person') {
            return this.fetchBrowsePeople$(normalizedCategory, 1);
        }

        return this.fetchBrowseMedia$(
            params.type,
            `${nextSortField}.${nextSortDirection}`,
            1,
            config,
            params.keywords,
            params.genreIds,
            params.yearFrom,
            params.yearTo,
            params.minRating,
            params.voteCountMin,
            params.runtimeMin,
            params.runtimeMax,
            params.certifications,
            params.originalLanguage,
            params.watchProviderIds,
        );
    }

    private handleLoadMoreRequest(): Observable<void> {
        const state = this.get();
        if (
            state.resultsState.type !== 'loaded' ||
            (state.type === 'person' && state.category === 'trending') ||
            state.pagination.page >= state.pagination.totalPages
        ) {
            return of(undefined);
        }

        this.patchState({
            resultsState: {
                type: 'loading-more',
                value: state.resultsState.value,
                placeholderCount: PAGE_SIZE,
            },
        });

        if (state.type === 'person') {
            return this.fetchBrowsePeople$(state.category, state.pagination.page + 1);
        }

        const config = this.getCategoryConfig(state.category, state.type);
        if (!config || !state.sortField) {
            return EMPTY;
        }

        return this.fetchBrowseMedia$(
            state.type,
            `${state.sortField}.${state.sortDirection}`,
            state.pagination.page + 1,
            config,
            state.keywordIds,
            state.genreIds,
            state.yearFrom,
            state.yearTo,
            state.minRating,
            state.voteCountMin,
            state.runtimeMin,
            state.runtimeMax,
            state.certifications,
            state.originalLanguage,
            state.watchProviderIds,
        );
    }

    private getCategoryConfig(category: BrowseCategory, type: BrowseMediaType): CategoryConfig | null {
        return CATEGORY_CONFIG[`${category}_${type}`] ?? null;
    }

    private getResultItems<T extends MediaListItem | PersonListItem>(): T[] {
        const { resultsState } = this.get();
        if (resultsState.type === 'loaded' || resultsState.type === 'loading-more') {
            return resultsState.value as T[];
        }

        return [];
    }

    private getVisibleCount(resultsState: LoadableItems<MediaListItem | PersonListItem>): number {
        if (resultsState.type !== 'loaded' && resultsState.type !== 'loading-more') {
            return 0;
        }

        return resultsState.value.length;
    }

    private getActiveFilterCount(state: DiscoverState): number {
        return [
            state.genreIds.length > 0,
            state.keywordIds.length > 0,
            state.yearFrom !== null,
            state.yearTo !== null,
            state.minRating !== null && state.minRating > 0,
            state.voteCountMin !== null && state.voteCountMin > 0,
            state.runtimeMin !== null,
            state.runtimeMax !== null,
            state.certifications.length > 0,
            state.originalLanguage !== null,
            state.watchProviderIds.length > 0,
        ].filter(Boolean).length;
    }

    private getSortOptions(type: BrowseMediaType): SortOption[] {
        return [...BROWSE_TYPE_CONFIG[type].sortOptions];
    }

    private getCategoryOptions(type: BrowseMediaType): CategoryOption[] {
        return [...BROWSE_TYPE_CONFIG[type].categories];
    }

    private normalizeBrowseType(value: string | null): BrowseMediaType {
        if (value === 'tv' || value === 'person') {
            return value;
        }

        return 'movie';
    }

    private normalizeSearchType(value: string | null): 'all' | BrowseMediaType {
        if (value === 'movie' || value === 'tv' || value === 'person') {
            return value;
        }

        return 'all';
    }

    private normalizeCategory(value: string | null, type: BrowseMediaType): BrowseCategory {
        const { categories, defaultCategory } = BROWSE_TYPE_CONFIG[type];

        return categories.some((category) => category.value === value) ? (value as BrowseCategory) : defaultCategory;
    }

    private patchLoadedResults<T extends MediaListItem | PersonListItem>(
        page: number,
        mapped: T[],
        resultPage?: number | null,
        totalPages?: number | null,
        totalResults?: number | null,
    ): void {
        const results = page === 1 ? mapped : [...this.getResultItems<T>(), ...mapped];

        this.patchState({
            pagination: {
                page: resultPage ?? page,
                totalPages: totalPages ?? 0,
            },
            totalResults: totalResults ?? 0,
            resultsState: {
                type: 'loaded',
                value: results,
            },
        });
    }

    private handleResultsError(): Observable<never> {
        const currentState = this.get().resultsState;
        this.patchState({
            resultsState: {
                type: 'loaded',
                value: currentState.type === 'loading-more' ? currentState.value : [],
            },
        });

        return EMPTY;
    }

    private normalizeSortDirection(value: string | null): SortDirection | undefined {
        return value === 'asc' || value === 'desc' ? value : undefined;
    }
}
