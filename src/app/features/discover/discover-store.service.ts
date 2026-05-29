import { Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import {
    EMPTY,
    Observable,
    catchError,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    forkJoin,
    map,
    merge,
    of,
    switchMap,
    tap,
} from 'rxjs';

import {
    CertificationRestControllerService,
    CompanyRestControllerService,
    Country,
    KeywordRestControllerService,
    Language,
    SearchRestControllerService,
    WatchProviderCatalogItem,
    WatchProviderRestControllerService,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    ConfigStoreService,
    formatCompanyName,
    GenreService,
    RemoteData,
    LocaleStoreService,
    MediaListItem,
    MediaType,
    parseBoundedIntegerParam,
    parseEnumParam,
    parseLanguageParam,
    parsePageParam,
    parsePositiveIntegerListParam,
    parsePositiveNumberParam,
    parseRegionParam,
    parseStringParam,
    SelectOption,
    serializeNumberListParam,
    serializePositiveNumberParam,
    SortDirection,
    toLanguageOptions,
    toRegionOptions,
} from '../../shared';
import {
    DISCOVER_DEFAULT_FILTERS,
    DISCOVER_PAGE_DEFINITIONS,
    DiscoverFilterVisibility,
    DiscoverMovieReleaseType,
    DiscoverPageDefinition,
    DiscoverPageKey,
    DiscoverQueryState,
    DiscoverRuntimePreset,
    DiscoverSortKey,
    MEDIA_TYPE_OPTIONS,
    MOVIE_SORT_OPTIONS,
    MOVIE_RELEASE_TYPE_FILTER_OPTIONS,
    RATING_FILTER_OPTIONS,
    RUNTIME_FILTER_OPTIONS,
    TV_SORT_OPTIONS,
    VOTE_COUNT_FILTER_OPTIONS,
} from './discover-page-definitions';
import { DiscoverQueryService } from './discover-query.service';

type ActiveFilterType =
    | 'genre'
    | 'year'
    | 'keyword'
    | 'company'
    | 'provider'
    | 'watch-region'
    | 'certification'
    | 'release-type'
    | 'language'
    | 'rating'
    | 'votes'
    | 'runtime';

export interface DiscoverActiveFilter {
    readonly id: string;
    readonly label: string;
    readonly type: ActiveFilterType;
    readonly value?: number | string;
}

export interface DiscoverLockedFilter {
    readonly id: string;
    readonly label: string;
}

interface DiscoverDisplayItem {
    readonly item: MediaListItem;
    readonly genreNames: string[];
    readonly routerLink: (string | number)[];
}

interface DiscoverPagination {
    readonly page: number;
    readonly totalPages: number;
}

interface DiscoverRouteRequest {
    readonly definition: DiscoverPageDefinition | null;
    readonly query: DiscoverQueryState;
    readonly page: number;
    readonly queryKey: string;
    readonly movieGenreMap: ReadonlyMap<number, string>;
    readonly tvGenreMap: ReadonlyMap<number, string>;
    readonly regionOptions: readonly SelectOption<string>[];
    readonly languageOptions: readonly SelectOption<string>[];
}

interface DiscoverState {
    readonly definition: DiscoverPageDefinition | null;
    readonly query: DiscoverQueryState;
    readonly resultsState: RemoteData<MediaListItem[]>;
    readonly pagination: DiscoverPagination;
    readonly totalResults: number;
    readonly movieGenreMap: ReadonlyMap<number, string>;
    readonly tvGenreMap: ReadonlyMap<number, string>;
    readonly providerOptions: readonly SelectOption<number>[];
    readonly certificationOptions: readonly SelectOption<string>[];
    readonly languageOptions: readonly SelectOption<string>[];
    readonly keywordSuggestions: readonly SelectOption<number>[];
    readonly companySuggestions: readonly SelectOption<number>[];
    readonly keywordLabelMap: ReadonlyMap<number, string>;
    readonly companyLabelMap: ReadonlyMap<number, string>;
    readonly regionOptions: readonly SelectOption<string>[];
}

const EMPTY_PAGINATION: DiscoverPagination = {
    page: 0,
    totalPages: 0,
};

const INITIAL_STATE: DiscoverState = {
    definition: null,
    query: {
        mediaType: 'movie',
        sortKey: 'popularity',
        sortDirection: 'desc',
        watchRegion: 'US',
        ...DISCOVER_DEFAULT_FILTERS,
    },
    resultsState: { state: 'notAsked' },
    pagination: { ...EMPTY_PAGINATION },
    totalResults: 0,
    movieGenreMap: new Map(),
    tvGenreMap: new Map(),
    providerOptions: [],
    certificationOptions: [],
    languageOptions: [],
    keywordSuggestions: [],
    companySuggestions: [],
    keywordLabelMap: new Map(),
    companyLabelMap: new Map(),
    regionOptions: [],
};

const DISCOVER_SORT_KEYS: readonly DiscoverSortKey[] = ['popularity', 'rating', 'release_date', 'title', 'vote_count'];

const DISCOVER_MEDIA_TYPES: readonly MediaType[] = ['movie', 'tv'];

const DISCOVER_RUNTIME_PRESETS: readonly DiscoverRuntimePreset[] = ['any', 'short', 'standard', 'long'];

const DISCOVER_MOVIE_RELEASE_TYPES: readonly DiscoverMovieReleaseType[] = [1, 2, 3, 4, 5, 6];

const DISCOVER_SORT_DIRECTIONS: readonly SortDirection[] = ['asc', 'desc'];

@Injectable()
export class DiscoverStoreService extends ComponentStore<DiscoverState> {
    readonly vm$ = this.select((state) => {
        const definition = state.definition;
        const filters = definition?.filters;
        const genreMap = this.getGenreMap(state.query.mediaType, state);
        const hasLoadedResults = state.resultsState.state === 'success' || state.resultsState.state === 'loading-more';
        const visibleCount = this.getVisibleCount(state.resultsState);
        const activeFilters = this.toActiveFilters(
            definition,
            state.query,
            genreMap,
            state.providerOptions,
            state.keywordLabelMap,
            state.companyLabelMap,
            state.regionOptions,
            state.languageOptions,
        );

        return {
            title: definition?.title ?? '',
            subtitle: definition?.subtitle ?? '',
            resultsState: state.resultsState,
            displayItems: this.toDisplayItems(state, genreMap),
            totalResults: state.totalResults,
            visibleCount,
            resultStart: this.getResultStart(state),
            resultEnd: this.getResultEnd(state),
            pageIndex: Math.max(state.pagination.page - 1, 0),
            pageSize: PAGE_SIZE,
            paginatorLength: this.getPaginatorLength(state),
            showPaginator: hasLoadedResults && this.getPaginatorLength(state) > PAGE_SIZE,
            showEmptyState: state.resultsState.state === 'success' && visibleCount === 0,
            showResultCount: hasLoadedResults,
            showSort: !!definition?.showSort,
            showFilters: this.showFilters(definition),
            showReset: this.hasResettableFilters(definition, state.query),
            showMediaTypeToggle: definition?.mode === 'advanced',
            showGenreFilter: !!filters?.genres,
            showKeywordFilter: !!filters?.keywords,
            showCompanyFilter: !!filters?.companies,
            showYearRangeFilter: !!filters?.yearRange,
            showWatchRegionFilter: !!filters?.watchRegion,
            showProviderFilter: !!filters?.providers,
            showCertificationFilter: !!filters?.certification && state.query.mediaType === 'movie',
            showReleaseTypeFilter: this.showReleaseTypeFilter(definition, state.query.mediaType),
            showLanguageFilter: !!filters?.language,
            showRatingFilter: !!filters?.rating,
            showVoteCountFilter: !!filters?.votes,
            showRuntimeFilter: !!filters?.runtime,
            mediaType: state.query.mediaType,
            mediaTypeOptions: [...MEDIA_TYPE_OPTIONS],
            sortKey: state.query.sortKey,
            sortDirection: state.query.sortDirection,
            sortOptions: this.getSortOptions(state.query.mediaType),
            genreOptions: this.toGenreOptions(genreMap),
            selectedGenreIds: [...state.query.genreIds],
            keywordSuggestions: [...state.keywordSuggestions],
            companySuggestions: [...state.companySuggestions],
            selectedYearFrom: state.query.yearFrom,
            selectedYearTo: state.query.yearTo,
            providerOptions: [...state.providerOptions],
            selectedProviderIds: [...state.query.providerIds],
            watchRegion: state.query.watchRegion,
            watchRegionOptions: [...state.regionOptions],
            certificationOptions: [...state.certificationOptions],
            selectedCertification: state.query.certification,
            releaseTypeOptions: [...MOVIE_RELEASE_TYPE_FILTER_OPTIONS],
            selectedReleaseType: state.query.releaseType,
            languageOptions: [...state.languageOptions],
            selectedOriginalLanguage: state.query.originalLanguage,
            selectedRating: state.query.voteAverageGte,
            selectedVoteCount: state.query.voteCountGte,
            selectedRuntime: state.query.runtimePreset,
            ratingOptions: [...RATING_FILTER_OPTIONS],
            voteCountOptions: [...VOTE_COUNT_FILTER_OPTIONS],
            runtimeOptions: [...RUNTIME_FILTER_OPTIONS],
            lockedFilters: this.toLockedFilters(definition),
            activeFilters,
            activeFilterCount: activeFilters.length,
        };
    });

    private readonly routeRequestEffect = this.effect<DiscoverRouteRequest>((request$) =>
        request$.pipe(switchMap((request) => this.handleRouteRequest(request))),
    );

    private readonly keywordSearchEffect = this.effect<string>((query$) =>
        query$.pipe(
            debounceTime(250),
            map((query) => query.trim()),
            distinctUntilChanged(),
            switchMap((query) => this.fetchKeywordSuggestions$(query)),
        ),
    );

    private readonly companySearchEffect = this.effect<string>((query$) =>
        query$.pipe(
            debounceTime(250),
            map((query) => query.trim()),
            distinctUntilChanged(),
            switchMap((query) => this.fetchCompanySuggestions$(query)),
        ),
    );

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly discoverQuery: DiscoverQueryService,
        private readonly localeStore: LocaleStoreService,
        private readonly certificationService: CertificationRestControllerService,
        private readonly companyService: CompanyRestControllerService,
        private readonly keywordService: KeywordRestControllerService,
        private readonly searchService: SearchRestControllerService,
        private readonly watchProviderService: WatchProviderRestControllerService,
        configStore: ConfigStoreService,
        genreService: GenreService,
    ) {
        super(INITIAL_STATE);
        this.routeRequestEffect(this.routeRequest$(genreService, configStore));
    }

    updateMediaType(value: unknown): void {
        const { definition, query } = this.get();

        if (definition?.mode !== 'advanced') {
            return;
        }

        const mediaType = parseEnumParam(value, DISCOVER_MEDIA_TYPES, query.mediaType);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                type: mediaType,
                genres: null,
                providers: null,
                certification: null,
                releaseType: null,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateSort(value: unknown): void {
        const { definition, query } = this.get();

        if (!definition?.showSort) {
            return;
        }

        const sortKey = parseEnumParam(value, DISCOVER_SORT_KEYS, query.sortKey);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { sort: sortKey, page: null },
            queryParamsHandling: 'merge',
        });
    }

    toggleSortDirection(): void {
        const { definition, query } = this.get();

        if (!definition?.showSort) {
            return;
        }

        const direction = query.sortDirection === 'asc' ? 'desc' : 'asc';

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { direction, page: null },
            queryParamsHandling: 'merge',
        });
    }

    updateGenres(value: unknown): void {
        if (!this.isFilterVisible('genres')) {
            return;
        }

        const genreIds = Array.isArray(value)
            ? value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry) && entry > 0)
            : [];

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                genres: serializeNumberListParam(genreIds),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateKeywordSearch(query: string): void {
        if (!this.isFilterVisible('keywords')) {
            return;
        }

        this.keywordSearchEffect(query);
    }

    addKeyword(value: unknown): void {
        if (!this.isFilterVisible('keywords')) {
            return;
        }

        const keywordId = Number(value);
        if (!Number.isFinite(keywordId) || keywordId <= 0) {
            return;
        }

        const keywordIds = [...new Set([...this.get().query.keywordIds, keywordId])];
        this.patchState({ keywordSuggestions: [] });

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                keywords: serializeNumberListParam(keywordIds),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateCompanySearch(query: string): void {
        if (!this.isFilterVisible('companies')) {
            return;
        }

        this.companySearchEffect(query);
    }

    addCompany(value: unknown): void {
        if (!this.isFilterVisible('companies')) {
            return;
        }

        const companyId = Number(value);
        if (!Number.isFinite(companyId) || companyId <= 0) {
            return;
        }

        const companyIds = [...new Set([...this.get().query.companyIds, companyId])];
        this.patchState({ companySuggestions: [] });

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                companies: serializeNumberListParam(companyIds),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateYearFrom(value: unknown): void {
        if (!this.isFilterVisible('yearRange')) {
            return;
        }

        this.updateYearRange(serializePositiveNumberParam(value), this.get().query.yearTo);
    }

    updateYearTo(value: unknown): void {
        if (!this.isFilterVisible('yearRange')) {
            return;
        }

        this.updateYearRange(this.get().query.yearFrom, serializePositiveNumberParam(value));
    }

    updateProviders(value: unknown): void {
        if (!this.isFilterVisible('providers')) {
            return;
        }

        const providerIds = Array.isArray(value)
            ? value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry) && entry > 0)
            : [];

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                providers: serializeNumberListParam(providerIds),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateCertification(value: unknown): void {
        if (!this.isFilterVisible('certification')) {
            return;
        }

        const certification = typeof value === 'string' && value.trim() ? value.trim() : null;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                certification,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateReleaseType(value: unknown): void {
        const { definition, query } = this.get();

        if (!this.showReleaseTypeFilter(definition, query.mediaType)) {
            return;
        }

        const releaseType = this.toMovieReleaseType(value);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                releaseType,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateOriginalLanguage(value: unknown): void {
        if (!this.isFilterVisible('language')) {
            return;
        }

        const originalLanguage = typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                language: originalLanguage,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateWatchRegion(value: unknown): void {
        if (!this.isFilterVisible('watchRegion')) {
            return;
        }

        const defaultRegion = this.localeStore.region() || 'US';
        const watchRegion = parseRegionParam(value, this.get().query.watchRegion);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                watchRegion: watchRegion === defaultRegion ? null : watchRegion,
                providers: null,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateRating(value: unknown): void {
        if (!this.isFilterVisible('rating')) {
            return;
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                rating: serializePositiveNumberParam(value),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateVoteCount(value: unknown): void {
        if (!this.isFilterVisible('votes')) {
            return;
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                votes: this.serializeVoteCount(value),
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    updateRuntime(value: unknown): void {
        if (!this.isFilterVisible('runtime')) {
            return;
        }

        const runtime = parseEnumParam(value, DISCOVER_RUNTIME_PRESETS, 'any');

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                runtime: runtime === 'any' ? null : runtime,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    clearFilter(filter: DiscoverActiveFilter): void {
        if (filter.type === 'genre') {
            const nextGenres = this.get().query.genreIds.filter((genreId) => genreId !== Number(filter.value));
            this.updateGenres(nextGenres);
            return;
        }

        if (filter.type === 'provider') {
            const nextProviders = this.get().query.providerIds.filter(
                (providerId) => providerId !== Number(filter.value),
            );
            this.updateProviders(nextProviders);
            return;
        }

        if (filter.type === 'keyword') {
            const nextKeywords = this.get().query.keywordIds.filter((keywordId) => keywordId !== Number(filter.value));
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    keywords: serializeNumberListParam(nextKeywords),
                    page: null,
                },
                queryParamsHandling: 'merge',
            });
            return;
        }

        if (filter.type === 'company') {
            const nextCompanies = this.get().query.companyIds.filter((companyId) => companyId !== Number(filter.value));
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    companies: serializeNumberListParam(nextCompanies),
                    page: null,
                },
                queryParamsHandling: 'merge',
            });
            return;
        }

        if (filter.type === 'year') {
            const value = String(filter.value);
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    yearFrom: value === 'from' || value === 'range' ? null : this.get().query.yearFrom,
                    yearTo: value === 'to' || value === 'range' ? null : this.get().query.yearTo,
                    page: null,
                },
                queryParamsHandling: 'merge',
            });
            return;
        }

        const queryParams: Record<string, string | number | null> = {};

        if (filter.type === 'watch-region') {
            queryParams['watchRegion'] = null;
            queryParams['providers'] = null;
            queryParams['page'] = null;
        }

        if (filter.type === 'certification') {
            queryParams['certification'] = null;
            queryParams['page'] = null;
        }

        if (filter.type === 'release-type') {
            queryParams['releaseType'] = null;
            queryParams['page'] = null;
        }

        if (filter.type === 'language') {
            queryParams['language'] = null;
            queryParams['page'] = null;
        }

        if (filter.type === 'rating') {
            queryParams['rating'] = null;
            queryParams['page'] = null;
        }

        if (filter.type === 'votes') {
            queryParams['votes'] = this.serializeVoteCount(null);
            queryParams['page'] = null;
        }

        if (filter.type === 'runtime') {
            queryParams['runtime'] = null;
            queryParams['page'] = null;
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge',
        });
    }

    reset(): void {
        const { definition, query } = this.get();
        const queryParams =
            definition?.mode === 'advanced' && query.mediaType !== definition.mediaType
                ? { type: query.mediaType }
                : {};

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
        });
    }

    updatePage(pageIndex: number): void {
        const page = Math.max(1, pageIndex + 1);

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: page === 1 ? null : page },
            queryParamsHandling: 'merge',
        });
    }

    private updateYearRange(yearFrom: number | null, yearTo: number | null): void {
        const nextYearFrom = yearFrom !== null && yearTo !== null && yearFrom > yearTo ? yearTo : yearFrom;
        const nextYearTo = yearFrom !== null && yearTo !== null && yearFrom > yearTo ? yearFrom : yearTo;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                yearFrom: nextYearFrom,
                yearTo: nextYearTo,
                page: null,
            },
            queryParamsHandling: 'merge',
        });
    }

    private routeRequest$(
        genreService: GenreService,
        configStore: ConfigStoreService,
    ): Observable<DiscoverRouteRequest> {
        return combineLatest({
            data: this.route.data,
            queryParams: this.route.queryParamMap,
            movieGenreMap: genreService.movieGenres$,
            tvGenreMap: genreService.tvGenres$,
            countries: configStore.countries$,
            languages: configStore.languages$,
            defaultRegion: this.localeStore.region$,
        }).pipe(
            map((source) => this.toRouteRequest(source)),
            distinctUntilChanged((previous, current) => previous.queryKey === current.queryKey),
        );
    }

    private toRouteRequest(source: {
        readonly data: Record<string, unknown>;
        readonly queryParams: ParamMap;
        readonly movieGenreMap: ReadonlyMap<number, string>;
        readonly tvGenreMap: ReadonlyMap<number, string>;
        readonly countries: readonly Country[];
        readonly languages: readonly Language[];
        readonly defaultRegion: string;
    }): DiscoverRouteRequest {
        const routePageKey = source.data['discoverPageKey'];
        const pageKey =
            typeof routePageKey === 'string' && routePageKey in DISCOVER_PAGE_DEFINITIONS
                ? (routePageKey as DiscoverPageKey)
                : null;
        const definition = pageKey ? DISCOVER_PAGE_DEFINITIONS[pageKey] : null;
        const query = this.toQueryState(definition, source.queryParams, source.defaultRegion);
        const page = parsePageParam(source.queryParams.get('page'));
        const regionOptions = toRegionOptions(source.countries, query.watchRegion);
        const languageOptions = toLanguageOptions(source.languages);
        const queryKey = JSON.stringify({
            pageKey,
            query,
            page,
            movieGenres: [...source.movieGenreMap.entries()],
            tvGenres: [...source.tvGenreMap.entries()],
            regionOptions,
            languageOptions,
        });

        return {
            definition,
            query,
            page,
            queryKey,
            movieGenreMap: source.movieGenreMap,
            tvGenreMap: source.tvGenreMap,
            regionOptions,
            languageOptions,
        };
    }

    private toQueryState(
        definition: DiscoverPageDefinition | null,
        params: ParamMap,
        defaultRegion: string,
    ): DiscoverQueryState {
        const fallbackRegion = defaultRegion || 'US';

        if (!definition) {
            return {
                mediaType: 'movie',
                sortKey: 'popularity',
                sortDirection: 'desc',
                watchRegion: fallbackRegion,
                ...DISCOVER_DEFAULT_FILTERS,
            };
        }

        const mediaType =
            definition.mode === 'advanced'
                ? parseEnumParam(params.get('type'), DISCOVER_MEDIA_TYPES, definition.mediaType)
                : definition.mediaType;
        const filters = definition.filters;

        return {
            mediaType,
            watchRegion: filters.watchRegion
                ? parseRegionParam(params.get('watchRegion'), fallbackRegion)
                : fallbackRegion,
            sortKey: definition.showSort
                ? parseEnumParam(params.get('sort'), DISCOVER_SORT_KEYS, definition.defaultSortKey)
                : definition.defaultSortKey,
            sortDirection: definition.showSort
                ? parseEnumParam(params.get('direction'), DISCOVER_SORT_DIRECTIONS, definition.defaultSortDirection)
                : definition.defaultSortDirection,
            genreIds: filters.genres ? parsePositiveIntegerListParam(params.get('genres')) : [],
            keywordIds: filters.keywords ? parsePositiveIntegerListParam(params.get('keywords')) : [],
            companyIds: filters.companies ? parsePositiveIntegerListParam(params.get('companies')) : [],
            providerIds: filters.providers ? parsePositiveIntegerListParam(params.get('providers')) : [],
            yearFrom: filters.yearRange ? parseBoundedIntegerParam(params.get('yearFrom'), 1874, 2100) : null,
            yearTo: filters.yearRange ? parseBoundedIntegerParam(params.get('yearTo'), 1874, 2100) : null,
            certification:
                filters.certification && mediaType === 'movie' ? parseStringParam(params.get('certification')) : null,
            releaseType: this.showReleaseTypeFilter(definition, mediaType)
                ? this.toMovieReleaseType(params.get('releaseType'))
                : null,
            originalLanguage: filters.language ? parseLanguageParam(params.get('language')) : null,
            voteAverageGte: filters.rating ? parsePositiveNumberParam(params.get('rating')) : null,
            voteCountGte: this.resolveVoteCountGte(definition, params),
            runtimePreset: filters.runtime ? parseEnumParam(params.get('runtime'), DISCOVER_RUNTIME_PRESETS, 'any') : 'any',
        };
    }

    private handleRouteRequest(request: DiscoverRouteRequest): Observable<void> {
        if (!request.definition) {
            this.router.navigateByUrl('/not-found', { replaceUrl: true });
            return EMPTY;
        }

        const definition = request.definition;

        this.patchState({
            definition,
            query: request.query,
            resultsState: { state: 'loading' },
            pagination: { ...EMPTY_PAGINATION },
            totalResults: 0,
            movieGenreMap: request.movieGenreMap,
            tvGenreMap: request.tvGenreMap,
            providerOptions: [],
            certificationOptions: [],
            languageOptions: request.languageOptions,
            keywordSuggestions: [],
            companySuggestions: [],
            keywordLabelMap: new Map(),
            companyLabelMap: new Map(),
            regionOptions: request.regionOptions,
        });

        return merge(
            this.fetchPage$(definition, request.query, request.page),
            forkJoin({
                providerOptions: this.fetchProviderOptions$(request.query.mediaType, request.query.watchRegion),
                certificationOptions: this.fetchCertificationOptions$(
                    definition,
                    request.query.mediaType,
                    request.query.watchRegion,
                ),
            }).pipe(
                tap(({ providerOptions, certificationOptions }) => {
                    this.patchState({
                        providerOptions,
                        certificationOptions,
                    });
                }),
                map(() => undefined),
            ),
            forkJoin({
                keywordLabelMap: this.fetchKeywordLabelMap$(request.query.keywordIds),
                companyLabelMap: this.fetchCompanyLabelMap$(request.query.companyIds),
            }).pipe(
                tap(({ keywordLabelMap, companyLabelMap }) => {
                    this.patchState({
                        keywordLabelMap,
                        companyLabelMap,
                    });
                }),
                map(() => undefined),
            ),
        );
    }

    private fetchPage$(definition: DiscoverPageDefinition, query: DiscoverQueryState, page: number): Observable<void> {
        return this.discoverQuery.list$(definition, query, page).pipe(
            tap((result) => {
                this.patchState({
                    resultsState: { state: 'success', data: [...result.items] },
                    pagination: {
                        page: result.page,
                        totalPages: result.totalPages,
                    },
                    totalResults: result.totalResults,
                });
            }),
            map(() => undefined),
            catchError(() => {
                this.patchState({
                    resultsState: {
                        state: 'success',
                        data: [],
                    },
                    pagination: { page, totalPages: page },
                    totalResults: 0,
                });
                return EMPTY;
            }),
        );
    }

    private fetchProviderOptions$(mediaType: MediaType, watchRegion: string): Observable<SelectOption<number>[]> {
        const request$ =
            mediaType === 'movie'
                ? this.watchProviderService.watchProvidersMovieList(
                      undefined,
                      watchRegion,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.watchProviderService.watchProviderTvList(
                      undefined,
                      watchRegion,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(
            map((catalog) => this.toProviderOptions(catalog.results ?? [])),
            catchError(() => of([] as SelectOption<number>[])),
        );
    }

    private fetchCertificationOptions$(
        definition: DiscoverPageDefinition,
        mediaType: MediaType,
        watchRegion: string,
    ): Observable<SelectOption<string>[]> {
        if (!definition.filters.certification || mediaType !== 'movie') {
            return of([]);
        }

        return this.certificationService.certificationMovieList('body', false, API_JSON_OPTIONS).pipe(
            map((result) => {
                const certifications = result.certifications?.[watchRegion] ?? result.certifications?.['US'] ?? [];

                return certifications
                    .filter(
                        (
                            certification,
                        ): certification is typeof certification & {
                            certification: string;
                        } => !!certification.certification,
                    )
                    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
                    .map((certification) => ({
                        label: certification.certification,
                        value: certification.certification,
                    }));
            }),
            catchError(() => of([] as SelectOption<string>[])),
        );
    }

    private fetchKeywordSuggestions$(query: string): Observable<void> {
        if (query.length < 2) {
            this.patchState({ keywordSuggestions: [] });
            return of(undefined);
        }

        return this.searchService.searchKeyword(query, 1, 'body', false, API_JSON_OPTIONS).pipe(
            tap((result) => {
                const selectedIds = new Set(this.get().query.keywordIds);
                const keywordSuggestions = (result.results ?? [])
                    .filter(
                        (keyword): keyword is { id: number; name: string } =>
                            typeof keyword.id === 'number' &&
                            typeof keyword.name === 'string' &&
                            keyword.name.length > 0 &&
                            !selectedIds.has(keyword.id),
                    )
                    .slice(0, 8)
                    .map((keyword) => ({
                        value: keyword.id,
                        label: keyword.name,
                    }));

                this.patchState({ keywordSuggestions });
            }),
            map(() => undefined),
            catchError(() => {
                this.patchState({ keywordSuggestions: [] });
                return of(undefined);
            }),
        );
    }

    private fetchKeywordLabelMap$(keywordIds: readonly number[]): Observable<ReadonlyMap<number, string>> {
        const uniqueKeywordIds = [...new Set(keywordIds)];

        if (!uniqueKeywordIds.length) {
            return of(new Map<number, string>());
        }

        return forkJoin(
            uniqueKeywordIds.map((keywordId) =>
                this.keywordService
                    .keywordDetails(keywordId, 'body', false, API_JSON_OPTIONS)
                    .pipe(catchError(() => of(null))),
            ),
        ).pipe(
            map(
                (keywords) =>
                    new Map(
                        keywords
                            .filter(
                                (keyword): keyword is { id: number; name: string } =>
                                    typeof keyword?.id === 'number' &&
                                    typeof keyword.name === 'string' &&
                                    keyword.name.length > 0,
                            )
                            .map((keyword) => [keyword.id, keyword.name]),
                    ),
            ),
            catchError(() => of(new Map<number, string>())),
        );
    }

    private fetchCompanySuggestions$(query: string): Observable<void> {
        if (query.length < 2) {
            this.patchState({ companySuggestions: [] });
            return of(undefined);
        }

        return this.searchService.searchCompany(query, 1, 'body', false, API_JSON_OPTIONS).pipe(
            tap((result) => {
                const selectedIds = new Set(this.get().query.companyIds);
                const companySuggestions = (result.results ?? [])
                    .filter(
                        (company): company is { id: number; name: string; origin_country?: string } =>
                            !!company.id && !!company.name && !selectedIds.has(company.id),
                    )
                    .slice(0, 8)
                    .map((company) => ({
                        value: company.id,
                        label: formatCompanyName(company.name, company.origin_country),
                    }));

                this.patchState({ companySuggestions });
            }),
            map(() => undefined),
            catchError(() => {
                this.patchState({ companySuggestions: [] });
                return of(undefined);
            }),
        );
    }

    private fetchCompanyLabelMap$(companyIds: readonly number[]): Observable<ReadonlyMap<number, string>> {
        const uniqueCompanyIds = [...new Set(companyIds)];

        if (!uniqueCompanyIds.length) {
            return of(new Map<number, string>());
        }

        return forkJoin(
            uniqueCompanyIds.map((companyId) =>
                this.companyService
                    .companyDetails(companyId, 'body', false, API_JSON_OPTIONS)
                    .pipe(catchError(() => of(null))),
            ),
        ).pipe(
            map(
                (companies) =>
                    new Map(
                        companies
                            .filter(
                                (company): company is { id: number; name: string; origin_country?: string } =>
                                    !!company?.id && !!company.name,
                            )
                            .map((company) => [company.id, formatCompanyName(company.name, company.origin_country)]),
                    ),
            ),
            catchError(() => of(new Map<number, string>())),
        );
    }

    private toDisplayItems(state: DiscoverState, genreMap: ReadonlyMap<number, string>): DiscoverDisplayItem[] {
        if (state.resultsState.state !== 'success' && state.resultsState.state !== 'loading-more') {
            return [];
        }

        return state.resultsState.data.map((item) => ({
            item,
            genreNames: (item.genreIds ?? [])
                .map((genreId) => genreMap.get(genreId))
                .filter((genreName): genreName is string => !!genreName)
                .slice(0, 3),
            routerLink: ['/title', item.id, item.mediaType],
        }));
    }

    private getResultStart(state: DiscoverState): number {
        const visibleCount = this.getVisibleCount(state.resultsState);
        if (visibleCount === 0 || state.totalResults === 0) {
            return 0;
        }

        return (Math.max(state.pagination.page, 1) - 1) * PAGE_SIZE + 1;
    }

    private getResultEnd(state: DiscoverState): number {
        const visibleCount = this.getVisibleCount(state.resultsState);
        if (visibleCount === 0 || state.totalResults === 0) {
            return 0;
        }

        return Math.min(state.totalResults, this.getResultStart(state) + visibleCount - 1);
    }

    private getPaginatorLength(state: DiscoverState): number {
        if (state.pagination.totalPages <= 0) {
            return state.totalResults;
        }

        return Math.min(state.totalResults, state.pagination.totalPages * PAGE_SIZE);
    }

    private toActiveFilters(
        definition: DiscoverPageDefinition | null,
        query: DiscoverQueryState,
        genreMap: ReadonlyMap<number, string>,
        providerOptions: readonly SelectOption<number>[],
        keywordLabelMap: ReadonlyMap<number, string>,
        companyLabelMap: ReadonlyMap<number, string>,
        regionOptions: readonly SelectOption<string>[],
        languageOptions: readonly SelectOption<string>[],
    ): DiscoverActiveFilter[] {
        if (!definition) {
            return [];
        }

        const filters = definition.filters;
        const activeFilters: DiscoverActiveFilter[] = [];
        const providerLabelMap = new Map(providerOptions.map((option) => [option.value, option.label]));
        const defaultWatchRegion = this.localeStore.region() || 'US';

        if (filters.genres) {
            query.genreIds.forEach((genreId) => {
                activeFilters.push({
                    id: `genre-${genreId}`,
                    label: genreMap.get(genreId) ?? `Genre ${genreId}`,
                    type: 'genre',
                    value: genreId,
                });
            });
        }

        if (filters.providers) {
            query.providerIds.forEach((providerId) => {
                activeFilters.push({
                    id: `provider-${providerId}`,
                    label: providerLabelMap.get(providerId) ?? `Provider ${providerId}`,
                    type: 'provider',
                    value: providerId,
                });
            });
        }

        if (filters.keywords) {
            query.keywordIds.forEach((keywordId) => {
                activeFilters.push({
                    id: `keyword-${keywordId}`,
                    label: keywordLabelMap.get(keywordId) ?? `Keyword ${keywordId}`,
                    type: 'keyword',
                    value: keywordId,
                });
            });
        }

        if (filters.companies) {
            query.companyIds.forEach((companyId) => {
                activeFilters.push({
                    id: `company-${companyId}`,
                    label: companyLabelMap.get(companyId) ?? `Company ${companyId}`,
                    type: 'company',
                    value: companyId,
                });
            });
        }

        if (filters.yearRange && (query.yearFrom !== null || query.yearTo !== null)) {
            activeFilters.push({
                id: 'year-range',
                label: this.toYearRangeLabel(query.yearFrom, query.yearTo),
                type: 'year',
                value: 'range',
            });
        }

        if (filters.watchRegion && query.watchRegion !== defaultWatchRegion) {
            const region = regionOptions.find((option) => option.value === query.watchRegion);
            activeFilters.push({
                id: 'watch-region',
                label: `Region: ${region?.label ?? query.watchRegion}`,
                type: 'watch-region',
                value: query.watchRegion,
            });
        }

        if (filters.certification && query.certification) {
            activeFilters.push({
                id: 'certification',
                label: `Rated ${query.certification}`,
                type: 'certification',
            });
        }

        if (this.showReleaseTypeFilter(definition, query.mediaType) && query.releaseType !== null) {
            activeFilters.push({
                id: 'release-type',
                label: this.toReleaseTypeFilterLabel(query.releaseType),
                type: 'release-type',
            });
        }

        if (filters.language && query.originalLanguage) {
            activeFilters.push({
                id: 'language',
                label: this.toLanguageFilterLabel(query.originalLanguage, languageOptions),
                type: 'language',
            });
        }

        if (filters.rating && query.voteAverageGte !== null) {
            activeFilters.push({
                id: 'rating',
                label: `${query.voteAverageGte}+ rating`,
                type: 'rating',
            });
        }

        if (filters.votes && query.voteCountGte !== null) {
            activeFilters.push({
                id: 'votes',
                label: `${query.voteCountGte}+ votes`,
                type: 'votes',
            });
        }

        if (filters.runtime && query.runtimePreset !== 'any') {
            const option = RUNTIME_FILTER_OPTIONS.find((entry) => entry.value === query.runtimePreset);
            activeFilters.push({
                id: 'runtime',
                label: option?.label ?? 'Runtime',
                type: 'runtime',
            });
        }

        return activeFilters;
    }

    private toLockedFilters(definition: DiscoverPageDefinition | null): DiscoverLockedFilter[] {
        return definition?.lockedFilters ? [...definition.lockedFilters] : [];
    }

    private getVisibleCount(resultsState: RemoteData<MediaListItem[]>): number {
        if (resultsState.state === 'success' || resultsState.state === 'loading-more') {
            return resultsState.data.length;
        }

        return 0;
    }

    private getGenreMap(mediaType: MediaType, state: DiscoverState): ReadonlyMap<number, string> {
        return mediaType === 'movie' ? state.movieGenreMap : state.tvGenreMap;
    }

    private toGenreOptions(genreMap: ReadonlyMap<number, string>): SelectOption<number>[] {
        return [...genreMap.entries()]
            .map(([value, label]) => ({ label, value }))
            .sort((left, right) => left.label.localeCompare(right.label));
    }

    private toProviderOptions(providers: readonly WatchProviderCatalogItem[]): SelectOption<number>[] {
        return providers
            .filter(
                (
                    provider,
                ): provider is WatchProviderCatalogItem & {
                    provider_id: number;
                    provider_name: string;
                } => typeof provider.provider_id === 'number' && typeof provider.provider_name === 'string',
            )
            .map((provider) => ({
                value: provider.provider_id,
                label: provider.provider_name,
                priority: provider.display_priority ?? 999,
            }))
            .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
            .map(({ value, label }) => ({ value, label }));
    }

    private toYearRangeLabel(yearFrom: number | null, yearTo: number | null): string {
        if (yearFrom !== null && yearTo !== null) {
            return `Years: ${yearFrom}-${yearTo}`;
        }

        if (yearFrom !== null) {
            return `From ${yearFrom}`;
        }

        return yearTo !== null ? `Until ${yearTo}` : 'Years';
    }

    private toLanguageFilterLabel(language: string, languageOptions: readonly SelectOption<string>[]): string {
        const option = languageOptions.find((entry) => entry.value === language);
        return `Language: ${option?.label ?? language.toUpperCase()}`;
    }

    private toReleaseTypeFilterLabel(releaseType: DiscoverMovieReleaseType): string {
        const option = MOVIE_RELEASE_TYPE_FILTER_OPTIONS.find((entry) => entry.value === releaseType);
        return `Release: ${option?.label ?? releaseType}`;
    }

    private getSortOptions(mediaType: MediaType): SelectOption<DiscoverSortKey>[] {
        return [...(mediaType === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS)];
    }

    private showFilters(definition: DiscoverPageDefinition | null): boolean {
        if (!definition) {
            return false;
        }

        return Object.values(definition.filters).some(Boolean);
    }

    private showReleaseTypeFilter(definition: DiscoverPageDefinition | null, mediaType: MediaType): boolean {
        return mediaType === 'movie' && !!definition?.filters.releaseType;
    }

    private hasResettableFilters(definition: DiscoverPageDefinition | null, query: DiscoverQueryState): boolean {
        if (!definition) {
            return false;
        }

        const filters = definition.filters;

        return (
            (filters.genres && query.genreIds.length > 0) ||
            (filters.keywords && query.keywordIds.length > 0) ||
            (filters.companies && query.companyIds.length > 0) ||
            (filters.providers && query.providerIds.length > 0) ||
            (filters.yearRange && (query.yearFrom !== null || query.yearTo !== null)) ||
            (filters.watchRegion && query.watchRegion !== (this.localeStore.region() || 'US')) ||
            (filters.certification && query.certification !== null) ||
            (this.showReleaseTypeFilter(definition, query.mediaType) && query.releaseType !== null) ||
            (filters.language && query.originalLanguage !== null) ||
            (filters.rating && query.voteAverageGte !== null) ||
            this.hasResettableVoteFilter(definition, query) ||
            (filters.runtime && query.runtimePreset !== 'any')
        );
    }

    private hasResettableVoteFilter(definition: DiscoverPageDefinition, query: DiscoverQueryState): boolean {
        if (!definition.filters.votes) {
            return false;
        }

        return query.voteCountGte !== (definition.defaultVoteCountGte ?? null);
    }

    private isFilterVisible(filter: keyof DiscoverFilterVisibility): boolean {
        return !!this.get().definition?.filters[filter];
    }

    private toMovieReleaseType(value: unknown): DiscoverMovieReleaseType | null {
        const releaseType = Number(value);

        return value !== null && DISCOVER_MOVIE_RELEASE_TYPES.includes(releaseType as DiscoverMovieReleaseType)
            ? (releaseType as DiscoverMovieReleaseType)
            : null;
    }

    private resolveVoteCountGte(definition: DiscoverPageDefinition, params: ParamMap): number | null {
        if (definition.lockedVoteCountGte !== undefined) {
            return definition.lockedVoteCountGte;
        }

        if (!definition.filters.votes) {
            return null;
        }

        if (params.get('votes') === 'any') {
            return null;
        }

        return parsePositiveNumberParam(params.get('votes')) ?? definition.defaultVoteCountGte ?? null;
    }

    private serializeVoteCount(value: unknown): string | number | null {
        const voteCount = serializePositiveNumberParam(value);
        const defaultVoteCount = this.get().definition?.defaultVoteCountGte ?? null;

        if (voteCount === null) {
            return defaultVoteCount !== null ? 'any' : null;
        }

        return voteCount === defaultVoteCount ? null : voteCount;
    }
}
