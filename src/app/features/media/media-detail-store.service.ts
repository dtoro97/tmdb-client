import {
    catchError,
    combineLatest,
    EMPTY,
    filter,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
    tap,
} from 'rxjs';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';

import {
    AggregateCredits,
    CollectionDetails,
    CollectionRestControllerService,
    ContentRatingList,
    Credits,
    ExternalIds,
    ImageList,
    KeywordListItem,
    Movie,
    MovieListItem,
    ReleaseDateList,
    TvEpisode,
    TvSeries,
    TvSeriesListItem,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    ConfigStoreService,
    ExternalLinks,
    LoadableItems,
    LoadableValue,
    MediaDetails,
    MediaType,
    PersonCardItem,
    ViewerImage,
    buildExternalLinks,
    loadedItems,
    isDefined,
    mapLoadableValue,
    toCardItem,
    toCastPersonCardItem,
    toMediaDetails,
    toYear,
    LocaleStoreService,
} from '../../shared';
import {
    CastCreditWithEpisodes,
    CrewCreditWithEpisodes,
} from './media-detail.models';
import {
    toCastFromAggregate,
    toCrewFromAggregate,
} from './media-detail-credits.mapper';
import { rankRelatedMedia } from './media-detail-recommendations.mapper';
import {
    WatchProviderCategories,
    buildProviderPreview,
    pickWatchProviderCategories,
} from './media-detail-watch-providers.mapper';
import { MediaApiService } from './media-api.service';

const TOP_CAST_PREVIEW_COUNT = 20;

function getTodayDateKey(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function toTvYearLabel(media: MediaDetails): string | null {
    if (media.mediaType !== 'tv') return null;
    const first = toYear(media.firstAirDate);
    const last = toYear(media.lastAirDate);
    if (!first) return null;
    return !last || first === last ? first : `${first} - ${last}`;
}

function shouldShowCreditsPanel(
    castState: { type: string; value?: unknown[] },
    crewState: { type: string; value?: unknown[] },
    creatorsCount: number,
): boolean {
    const hasLoaded = (s: { type: string; value?: unknown[] }) =>
        s.type === 'loaded' && (s.value?.length ?? 0) > 0;
    return (
        castState.type !== 'loaded' ||
        crewState.type !== 'loaded' ||
        hasLoaded(castState) ||
        hasLoaded(crewState) ||
        creatorsCount > 0
    );
}

function canRateMedia(media: MediaDetails): boolean {
    const primaryReleaseDate = media.releaseDate ?? media.firstAirDate;

    if (!primaryReleaseDate) {
        return true;
    }

    return primaryReleaseDate <= getTodayDateKey();
}

export interface MediaState {
    mediaId: number | null;
    media: LoadableValue<Movie | TvSeries | null>;
    type: MediaType | '';
    cast: LoadableItems<CastCreditWithEpisodes>;
    crew: LoadableItems<CrewCreditWithEpisodes>;
    recommendations: LoadableItems<CardItem>;
    photos: LoadableItems<ViewerImage>;
    keywords: LoadableItems<KeywordListItem>;
    collection: LoadableValue<CollectionDetails | null>;
    externalLinks: ExternalLinks | null;
    watchProviders: LoadableValue<WatchProviderCategories | null>;
    certification: LoadableValue<string | null>;
}

const INITIAL_STATE: MediaState = {
    mediaId: null,
    type: '',
    media: { type: 'idle' },
    cast: { type: 'idle' },
    crew: { type: 'idle' },
    recommendations: { type: 'idle' },
    photos: { type: 'idle' },
    keywords: { type: 'idle' },
    collection: { type: 'idle' },
    externalLinks: null,
    watchProviders: { type: 'idle' },
    certification: { type: 'idle' },
};

@Injectable()
export class MediaDetailStoreService extends ComponentStore<MediaState> {
    private readonly rawMediaState$ = this.select((state) => state.media);
    readonly rawMedia$ = this.rawMediaState$.pipe(
        map((state) => (state.type === 'loaded' ? state.value : null)),
    );
    private readonly type$ = this.select((state) => state.type).pipe(
        filter((type) => !!type),
    );

    castState$ = this.select((state) => state.cast);
    crewState$ = this.select((state) => state.crew);
    private readonly topCastState$ = this.castState$.pipe(
        map((state): LoadableItems<PersonCardItem> => {
            if (state.type === 'idle' || state.type === 'loading') {
                return state;
            }

            if (state.type === 'loading-more') {
                return {
                    type: 'loading-more',
                    value: state.value
                        .slice(0, TOP_CAST_PREVIEW_COUNT)
                        .map((member) => toCastPersonCardItem(member)),
                    placeholderCount: state.placeholderCount,
                };
            }

            return {
                type: 'loaded',
                value: state.value
                    .slice(0, TOP_CAST_PREVIEW_COUNT)
                    .map((member) => toCastPersonCardItem(member)),
            };
        }),
    );
    recommendationsState$ = this.select((state) => state.recommendations);
    photosState$ = this.select((state) => state.photos);
    private readonly keywordsState$ = this.select((state) => state.keywords);
    private readonly collectionState$ = this.select(
        (state) => state.collection,
    );
    private readonly watchProvidersState$ = this.select(
        (state) => state.watchProviders,
    );
    private readonly certificationState$ = this.select(
        (state) => state.certification,
    );
    readonly cast$: Observable<CastCreditWithEpisodes[]> = this.castState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly crew$: Observable<CrewCreditWithEpisodes[]> = this.crewState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly castCrew$ = combineLatest([this.cast$, this.crew$]).pipe(
        map(([cast, crew]) => ({ cast, crew })),
    );

    private readonly directors$: Observable<CrewCreditWithEpisodes[]> =
        this.crew$.pipe(
            map((crew) => {
                return crew.reduce(
                    (acc, member) => {
                        if (
                            member.job === 'Director' &&
                            !acc.some((m) => m.id === member.id)
                        ) {
                            acc.push(member);
                        }

                        return acc;
                    },
                    [] as typeof crew,
                );
            }),
        );

    private readonly externalLinks$ = this.select(
        (state) => state.externalLinks,
    );

    readonly recommendations$ = this.recommendationsState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly mediaDetailsState$: Observable<
        LoadableValue<MediaDetails | null>
    > = combineLatest([
        this.rawMediaState$,
        this.type$,
        this.configStoreService.languages$,
    ]).pipe(
        map(([media, type, languages]): LoadableValue<MediaDetails | null> => {
            if (media.type === 'idle' || media.type === 'loading') {
                return media;
            }

            if (!media.value) {
                return { type: 'loaded', value: null };
            }
            return {
                type: 'loaded',
                value: toMediaDetails(media.value, type, languages),
            };
        }),
    );

    readonly mediaDetails$: Observable<MediaDetails> =
        this.mediaDetailsState$.pipe(
            map((state) => (state.type === 'loaded' ? state.value : null)),
            filter(isDefined),
        );

    readonly title$ = this.mediaDetails$.pipe(map((media) => media.title));

    readonly allPhotos$ = this.photosState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly mediaDetailVm$ = combineLatest({
        mediaDetailsState: this.mediaDetailsState$,
        topCastState: this.topCastState$,
        castState: this.castState$,
        crewState: this.crewState$,
        directors: this.directors$,
        externalLinks: this.externalLinks$,
        certification: this.certificationState$,
        watchProviders: this.watchProvidersState$,
        collection: this.collectionState$,
        photosState: this.photosState$,
        recommendations: this.recommendationsState$,
        keywords: this.keywordsState$,
    }).pipe(
        map(
            ({
                mediaDetailsState,
                topCastState,
                castState,
                crewState,
                directors,
                externalLinks,
                certification,
                watchProviders,
                collection,
                photosState,
                recommendations,
                keywords,
            }) => {
                if (
                    mediaDetailsState.type !== 'loaded' ||
                    !mediaDetailsState.value
                ) {
                    return null;
                }

                const media = mediaDetailsState.value;
                const creators = media.creators ?? [];
                const allPhotos = loadedItems(photosState);
                return {
                    media,
                    canRateTitle: canRateMedia(media),
                    tvYearLabel: toTvYearLabel(media),
                    externalLinks,
                    certification,
                    watchProviders: mapLoadableValue(
                        watchProviders,
                        (providers) => buildProviderPreview(providers),
                    ),
                    creditsPanel: {
                        topCastState,
                        castState,
                        crewState,
                        directors: directors.map((d) => ({
                            id: d.id,
                            name: d.name,
                        })),
                        creators,
                        showPanel: shouldShowCreditsPanel(
                            castState,
                            crewState,
                            creators.length,
                        ),
                    },
                    collection,
                    latestEpisode: media.lastEpisode
                        ? {
                              type: 'loaded' as const,
                              value: media.lastEpisode as TvEpisode,
                          }
                        : { type: 'idle' as const },
                    photos: {
                        state: photosState,
                        allPhotos,
                        totalCount: allPhotos.length,
                    },
                    recommendations,
                    keywords,
                };
            },
        ),
    );

    constructor(
        private mediaApiService: MediaApiService,
        private collectionRestControllerService: CollectionRestControllerService,
        private configStoreService: ConfigStoreService,
        private router: Router,
        private localStoreService: LocaleStoreService,
    ) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    getDetails$(id: number, type: MediaType) {
        const mediaType = type === 'tv' ? 'tv' : 'movie';

        this.patchState({
            ...INITIAL_STATE,
            mediaId: id,
            type: mediaType,
            cast: { type: 'loading' },
            crew: { type: 'loading' },
            recommendations: { type: 'loading' },
            photos: { type: 'loading' },
            keywords: { type: 'loading' },
            collection: { type: 'loading' },
            watchProviders: { type: 'loading' },
            certification: { type: 'loading' },
        });

        return this.mediaApiService.getDetails$(id, mediaType).pipe(
            catchError(() => {
                this.router.navigate(['not-found']);
                return EMPTY;
            }),
            tap((media) => {
                const externalIds = (
                    media as (Movie | TvSeries) & {
                        external_ids?: ExternalIds;
                    }
                ).external_ids;
                this.patchState({
                    media: { type: 'loaded', value: media },
                    externalLinks: buildExternalLinks(
                        externalIds ?? null,
                        media.homepage ?? null,
                        'title',
                    ),
                });
            }),
            switchMap((media) =>
                forkJoin([
                    this.loadSupplementaryData$(id, mediaType),
                    this.loadCollection$(media),
                ]).pipe(map(() => media)),
            ),
        );
    }

    private loadSupplementaryData$(
        id: number,
        type: Extract<MediaType, 'movie' | 'tv'>,
    ) {
        const country = this.localStoreService.region();

        return forkJoin([
            this.loadCredits$(id, type),
            this.loadRecommendations$(id, type),
            this.loadPhotos$(id, type),
            this.loadKeywords$(id, type),
            this.loadWatchProviders$(id, type, country),
            this.loadCertification$(id, type, country),
        ]);
    }

    private loadCredits$(id: number, type: MediaType): Observable<void> {
        return this.mediaApiService.getCredits$(id, type).pipe(
            catchError(() => of({ cast: [], crew: [] } as Credits)),
            tap((credits) => {
                const isAggregate = type === 'tv';
                this.patchState({
                    cast: {
                        type: 'loaded',
                        value: isAggregate
                            ? toCastFromAggregate(credits as AggregateCredits)
                            : (((credits as Credits).cast ??
                                  []) as CastCreditWithEpisodes[]),
                    },
                    crew: {
                        type: 'loaded',
                        value: isAggregate
                            ? toCrewFromAggregate(credits as AggregateCredits)
                            : (((credits as Credits).crew ??
                                  []) as CrewCreditWithEpisodes[]),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadRecommendations$(
        id: number,
        type: MediaType,
    ): Observable<void> {
        const mediaState = this.get().media;

        if (mediaState.type !== 'loaded' || !mediaState.value) {
            this.patchState({ recommendations: { type: 'loaded', value: [] } });
            return of(undefined);
        }

        const sourceMedia = mediaState.value;

        return forkJoin({
            similar: this.mediaApiService
                .getSimilar$(id, type)
                .pipe(catchError(() => of({ results: [] }))),
            recommendations: this.mediaApiService
                .getRecommendations$(id, type)
                .pipe(catchError(() => of({ results: [] }))),
        }).pipe(
            tap(({ similar, recommendations }) => {
                const rankedItems = rankRelatedMedia(
                    sourceMedia,
                    type,
                    (similar.results ?? []) as (
                        | MovieListItem
                        | TvSeriesListItem
                    )[],
                    (recommendations.results ?? []) as (
                        | MovieListItem
                        | TvSeriesListItem
                    )[],
                    PAGE_SIZE,
                );
                this.patchState({
                    recommendations: {
                        type: 'loaded',
                        value: rankedItems
                            .slice(0, PAGE_SIZE)
                            .map((item) => toCardItem(item, type)),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadPhotos$(id: number, type: MediaType): Observable<void> {
        return this.mediaApiService.getImages$(id, type).pipe(
            catchError(() => of({} as ImageList)),
            tap((images) => {
                this.patchState({
                    photos: {
                        type: 'loaded',
                        value: [
                            ...(images.backdrops ?? []).map((img) => ({
                                ...img,
                                photoType: 'backdrop',
                            })),
                            ...(images.posters ?? []).map((img) => ({
                                ...img,
                                photoType: 'poster',
                            })),
                        ],
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadKeywords$(id: number, type: MediaType): Observable<void> {
        return this.mediaApiService.getKeywords$(id, type).pipe(
            catchError(() => of({ results: [], keywords: [] })),
            tap((response) => {
                const items = ((type === 'tv'
                    ? response.results
                    : response.keywords) ?? []) as KeywordListItem[];
                this.patchState({
                    keywords: {
                        type: 'loaded',
                        value: items.filter(
                            (keyword) => !!keyword.id && !!keyword.name,
                        ),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadWatchProviders$(
        id: number,
        type: MediaType,
        country: string,
    ): Observable<void> {
        return this.mediaApiService.getWatchProviders$(id, type).pipe(
            catchError(() => of(null)),
            tap((providers) => {
                this.patchState({
                    watchProviders: {
                        type: 'loaded',
                        value: pickWatchProviderCategories(providers, country),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadCertification$(
        id: number,
        type: MediaType,
        country: string,
    ): Observable<void> {
        return this.mediaApiService.getCertification$(id, type).pipe(
            catchError(() => of(null)),
            tap((response) => {
                let value: string | null = null;
                if (type === 'tv') {
                    const rating = (
                        (response as ContentRatingList).results ?? []
                    )
                        .find((r) => r.iso_3166_1 === country)
                        ?.rating?.trim();
                    value = rating || null;
                } else {
                    const countryDates = (
                        (response as ReleaseDateList).results ?? []
                    ).find((r) => r.iso_3166_1 === country);
                    value =
                        countryDates?.release_dates
                            ?.map((r) => r.certification?.trim())
                            .find((c): c is string => !!c) ?? null;
                }
                this.patchState({
                    certification: { type: 'loaded', value },
                });
            }),
            map(() => undefined),
        );
    }

    private loadCollection$(media: Movie | TvSeries): Observable<void> {
        const collectionId = (media as Movie).belongs_to_collection?.id;

        if (!collectionId) {
            this.patchState({
                collection: { type: 'loaded', value: null },
            });
            return of(undefined);
        }

        return this.collectionRestControllerService
            .collectionDetails(
                collectionId,
                undefined,
                undefined,
                undefined,
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((collection) => {
                    this.patchState({
                        collection: {
                            type: 'loaded',
                            value: collection,
                        },
                    });
                }),
                catchError(() => {
                    this.patchState({
                        collection: { type: 'loaded', value: null },
                    });
                    return of(undefined);
                }),
                map(() => undefined),
            );
    }
}
