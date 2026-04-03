import {
    catchError,
    combineLatest,
    EMPTY,
    filter,
    forkJoin,
    iif,
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
    AggregateCastMember,
    AggregateCrewMember,
    CastMember,
    CollectionDetails,
    CollectionRestControllerService,
    Credits,
    CrewMember,
    ExternalIds,
    ImageList,
    KeywordListItem,
    Movie,
    MovieListItem,
    MovieRestControllerService,
    Review,
    ReviewPage,
    TvSeries,
    TvSeriesListItem,
    TvSeriesRestControllerService,
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
    loadedItems,
    isDefined,
    getBrowserCountry,
    toCastPersonCardItem,
    toMediaDetails,
} from '../../shared';
import { MediaDetailVm } from './media-detail.models';
import {
    WatchProviderCategories,
    buildMediaExternalLinks,
    buildProviderPreview,
    extractMovieCertification,
    extractTvCertification,
    rankRelatedMedia,
    mapLoadableValue,
    normalizeAllReviews,
    pickWatchProviderCategories,
    shouldShowCreditsPanel,
    sortReviewsForPreview,
    toCreditsLinkItems,
    toLatestEpisodeState,
    toTvYearLabel,
} from './media-detail.store.utils';

type CastCreditWithEpisodes = CastMember & {
    episode_count?: number;
};

type CrewCreditWithEpisodes = CrewMember & {
    episode_count?: number;
};

const TOP_CAST_PREVIEW_COUNT = 20;
const REVIEW_PREVIEW_COUNT = 3;
const REVIEW_PREVIEW_MIN_CONTENT_LENGTH = 100;

interface ReviewPaginationState {
    page: number;
    totalPages: number;
    totalResults: number;
    mediaId?: number;
    mediaType?: MediaType;
}

export interface MediaState {
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
    reviews: LoadableItems<Review>;
    reviewPagination: ReviewPaginationState;
}

const INITIAL_STATE: MediaState = {
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
    reviews: { type: 'idle' },
    reviewPagination: {
        page: 0,
        totalPages: 0,
        totalResults: 0,
    },
};

@Injectable()
export class MediaDetailStoreService extends ComponentStore<MediaState> {
    private readonly rawMediaState$ = this.select((state) => state.media);
    readonly rawMedia$ = this.rawMediaState$.pipe(
        map((state) => (state.type === 'loaded' ? state.value : null)),
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
    reviewsState$ = this.select((state) => state.reviews);

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
                const seen = new Set<number>();

                return crew.filter((member) => {
                    if (member.job !== 'Director' || seen.has(member.id!)) {
                        return false;
                    }

                    seen.add(member.id!);
                    return true;
                });
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

    readonly reviews$ = this.reviewsState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly reviewTotalResults$ = this.select(
        (state) => state.reviewPagination.totalResults,
    );

    readonly hasMoreReviews$ = this.select(
        (state) =>
            state.reviewPagination.page < state.reviewPagination.totalPages,
    );

    readonly title$ = this.mediaDetails$.pipe(map((media) => media.title));

    readonly allPhotos$ = this.photosState$.pipe(
        map((state) => loadedItems(state)),
    );

    readonly mediaDetailVm$: Observable<MediaDetailVm | null> = combineLatest({
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
        reviewsState: this.reviewsState$,
        reviewTotalResults: this.reviewTotalResults$,
        hasMoreReviews: this.hasMoreReviews$,
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
                reviewsState,
                reviewTotalResults,
                hasMoreReviews,
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
                const loadedReviews = loadedItems(reviewsState);

                return {
                    media,
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
                        directors: toCreditsLinkItems(directors),
                        creators,
                        showPanel: shouldShowCreditsPanel(
                            castState,
                            crewState,
                            creators.length,
                        ),
                    },
                    collection,
                    latestEpisode: toLatestEpisodeState(media.lastEpisode),
                    photos: {
                        state: photosState,
                        allPhotos,
                        totalCount: allPhotos.length,
                    },
                    reviews: {
                        state: reviewsState,
                        previewReviews: sortReviewsForPreview(
                            loadedReviews.filter(
                                (review) =>
                                    (review.content?.trim().length ?? 0) >=
                                    REVIEW_PREVIEW_MIN_CONTENT_LENGTH,
                            ),
                        ).slice(0, REVIEW_PREVIEW_COUNT),
                        totalResults: reviewTotalResults,
                        hasMore: hasMoreReviews,
                    },
                    recommendations,
                    keywords,
                } satisfies MediaDetailVm;
            },
        ),
    );

    constructor(
        private movieRestControllerService: MovieRestControllerService,
        private tvSeriesRestControllerService: TvSeriesRestControllerService,
        private collectionRestControllerService: CollectionRestControllerService,
        private configStoreService: ConfigStoreService,
        private router: Router,
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
            type: mediaType,
            cast: { type: 'loading' },
            crew: { type: 'loading' },
            recommendations: { type: 'loading' },
            photos: { type: 'loading' },
            keywords: { type: 'loading' },
            collection: { type: 'loading' },
            watchProviders: { type: 'loading' },
            certification: { type: 'loading' },
            reviews: { type: 'loading' },
            reviewPagination: {
                page: 0,
                totalPages: 0,
                totalResults: 0,
                mediaId: id,
                mediaType,
            },
        });

        return this.detailsRequest$(id, mediaType).pipe(
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
                    externalLinks: buildMediaExternalLinks(
                        externalIds ?? null,
                        media.homepage ?? null,
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

    private get type$() {
        return this.select((state) => state.type).pipe(
            filter((type) => !!type),
        );
    }

    private loadSupplementaryData$(id: number, type: MediaType) {
        const browserCountry = getBrowserCountry();

        return forkJoin([
            this.loadCredits$(id, type),
            this.loadRecommendations$(id, type),
            this.loadPhotos$(id, type),
            this.loadKeywords$(id, type),
            this.loadWatchProviders$(id, type, browserCountry),
            this.loadCertification$(id, type, browserCountry),
            this.loadReviews$(id, type),
        ]);
    }

    private loadCredits$(id: number, type: MediaType): Observable<void> {
        if (type === 'tv') {
            return this.tvSeriesRestControllerService
                .tvSeriesAggregateCredits(
                    id,
                    undefined,
                    undefined,
                    undefined,
                    API_JSON_OPTIONS,
                )
                .pipe(
                    catchError(() =>
                        of({ cast: [], crew: [] } as AggregateCredits),
                    ),
                    tap((credits) => {
                        this.patchState({
                            cast: {
                                type: 'loaded',
                                value: this.toCastFromAggregate(credits),
                            },
                            crew: {
                                type: 'loaded',
                                value: this.toCrewFromAggregate(credits),
                            },
                        });
                    }),
                    map(() => undefined),
                );
        }

        return this.movieRestControllerService
            .movieCredits(id, undefined, undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                catchError(() => of({ cast: [], crew: [] } as Credits)),
                tap((credits) => {
                    this.patchState({
                        cast: {
                            type: 'loaded',
                            value: (credits.cast ??
                                []) as CastCreditWithEpisodes[],
                        },
                        crew: {
                            type: 'loaded',
                            value: (credits.crew ??
                                []) as CrewCreditWithEpisodes[],
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
            this.patchState({
                recommendations: { type: 'loaded', value: [] },
            });
            return of(undefined);
        }

        const sourceMedia = mediaState.value;

        if (type === 'tv') {
            return forkJoin({
                similar: this.tvSeriesRestControllerService
                    .tvSeriesSimilar(
                        String(id),
                        undefined,
                        1,
                        undefined,
                        undefined,
                        API_JSON_OPTIONS,
                    )
                    .pipe(catchError(() => of({ results: [] }))),
                recommendations: this.tvSeriesRestControllerService
                    .tvSeriesRecommendations(
                        id,
                        undefined,
                        1,
                        undefined,
                        undefined,
                        API_JSON_OPTIONS,
                    )
                    .pipe(catchError(() => of({ results: [] }))),
            }).pipe(
                tap(({ similar, recommendations }) => {
                    const rankedItems = rankRelatedMedia(
                        sourceMedia,
                        'tv',
                        (similar.results ?? []) as TvSeriesListItem[],
                        (recommendations.results ?? []) as TvSeriesListItem[],
                        PAGE_SIZE,
                    );

                    this.patchState({
                        recommendations: {
                            type: 'loaded',
                            value: this.toCardItems(rankedItems, 'tv'),
                        },
                    });
                }),
                map(() => undefined),
            );
        }

        return forkJoin({
            similar: this.movieRestControllerService
                .movieSimilar(
                    id,
                    undefined,
                    1,
                    undefined,
                    undefined,
                    API_JSON_OPTIONS,
                )
                .pipe(catchError(() => of({ results: [] }))),
            recommendations: this.movieRestControllerService
                .movieRecommendations(
                    id,
                    undefined,
                    1,
                    undefined,
                    undefined,
                    API_JSON_OPTIONS,
                )
                .pipe(catchError(() => of({ results: [] }))),
        }).pipe(
            tap(({ similar, recommendations }) => {
                const rankedItems = rankRelatedMedia(
                    sourceMedia,
                    'movie',
                    (similar.results ?? []) as MovieListItem[],
                    (recommendations.results ?? []) as MovieListItem[],
                    PAGE_SIZE,
                );

                this.patchState({
                    recommendations: {
                        type: 'loaded',
                        value: this.toCardItems(rankedItems, 'movie'),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadPhotos$(id: number, type: MediaType): Observable<void> {
        const request$ =
            type === 'tv'
                ? this.tvSeriesRestControllerService.tvSeriesImages(
                      id,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      API_JSON_OPTIONS,
                  )
                : this.movieRestControllerService.movieImages(
                      id,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(
            catchError(() => of({} as ImageList)),
            tap((images) => {
                this.patchState({
                    photos: {
                        type: 'loaded',
                        value: this.toViewerImages(images),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadKeywords$(id: number, type: MediaType): Observable<void> {
        if (type === 'tv') {
            return this.tvSeriesRestControllerService
                .tvSeriesKeywords(id, undefined, undefined, API_JSON_OPTIONS)
                .pipe(
                    catchError(() => of({ results: [] })),
                    tap((keywords) => {
                        this.patchState({
                            keywords: {
                                type: 'loaded',
                                value: (keywords.results ?? []).filter(
                                    (keyword): keyword is KeywordListItem =>
                                        !!keyword.id && !!keyword.name,
                                ),
                            },
                        });
                    }),
                    map(() => undefined),
                );
        }

        return this.movieRestControllerService
            .movieKeywords(String(id), undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                catchError(() => of({ keywords: [] })),
                tap((keywords) => {
                    this.patchState({
                        keywords: {
                            type: 'loaded',
                            value: (keywords.keywords ?? []).filter(
                                (keyword): keyword is KeywordListItem =>
                                    !!keyword.id && !!keyword.name,
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
        browserCountry: string,
    ): Observable<void> {
        const request$ =
            type === 'tv'
                ? this.tvSeriesRestControllerService.tvSeriesWatchProviders(
                      id,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieRestControllerService.movieWatchProviders(
                      id,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(
            catchError(() => of(null)),
            tap((providers) => {
                this.patchState({
                    watchProviders: {
                        type: 'loaded',
                        value: pickWatchProviderCategories(
                            providers,
                            browserCountry,
                        ),
                    },
                });
            }),
            map(() => undefined),
        );
    }

    private loadCertification$(
        id: number,
        type: MediaType,
        browserCountry: string,
    ): Observable<void> {
        if (type === 'tv') {
            return this.tvSeriesRestControllerService
                .tvSeriesContentRatings(id, 'body', false, API_JSON_OPTIONS)
                .pipe(
                    catchError(() => of(null)),
                    tap((ratings) => {
                        this.patchState({
                            certification: {
                                type: 'loaded',
                                value: extractTvCertification(
                                    ratings,
                                    browserCountry,
                                ),
                            },
                        });
                    }),
                    map(() => undefined),
                );
        }

        return this.movieRestControllerService
            .movieReleaseDates(id, 'body', false, API_JSON_OPTIONS)
            .pipe(
                catchError(() => of(null)),
                tap((releaseDates) => {
                    this.patchState({
                        certification: {
                            type: 'loaded',
                            value: extractMovieCertification(
                                releaseDates,
                                browserCountry,
                            ),
                        },
                    });
                }),
                map(() => undefined),
            );
    }

    private loadReviews$(id: number, type: MediaType): Observable<void> {
        return this.fetchReviewsPage$(id, type, 1).pipe(
            tap((reviewPage) => {
                this.patchState(
                    this.toInitialReviewsState(reviewPage, id, type),
                );
            }),
            map(() => undefined),
        );
    }

    loadMoreReviews$(): Observable<void> {
        const { reviewPagination, reviews } = this.get();
        const currentReviews =
            reviews.type === 'loaded' || reviews.type === 'loading-more'
                ? reviews.value
                : [];

        if (
            !reviewPagination.mediaId ||
            !reviewPagination.mediaType ||
            reviewPagination.page >= reviewPagination.totalPages ||
            reviews.type === 'loading-more'
        ) {
            return of(undefined);
        }

        this.patchState({
            reviews: {
                type: 'loading-more',
                value: currentReviews,
                placeholderCount: PAGE_SIZE,
            },
        });

        return this.fetchReviewsPage$(
            reviewPagination.mediaId,
            reviewPagination.mediaType,
            reviewPagination.page + 1,
        ).pipe(
            tap((reviewPage) => {
                const normalizedReviews = normalizeAllReviews(reviewPage);
                this.patchState({
                    reviews: {
                        type: 'loaded',
                        value: [...currentReviews, ...normalizedReviews],
                    },
                    reviewPagination: {
                        ...reviewPagination,
                        page: reviewPage?.page ?? reviewPagination.page + 1,
                        totalPages:
                            reviewPage?.total_pages ??
                            reviewPagination.totalPages,
                        totalResults:
                            reviewPage?.total_results ??
                            reviewPagination.totalResults,
                    },
                });
            }),
            map(() => undefined),
            catchError(() => {
                this.patchState({
                    reviews: {
                        type: 'loaded',
                        value: currentReviews,
                    },
                });
                return EMPTY;
            }),
        );
    }

    private toInitialReviewsState(
        reviewPage: ReviewPage | null | undefined,
        mediaId: number,
        mediaType: MediaType,
    ): Pick<MediaState, 'reviews' | 'reviewPagination'> {
        return {
            reviews: {
                type: 'loaded',
                value: normalizeAllReviews(reviewPage),
            },
            reviewPagination: {
                page: reviewPage?.page ?? 1,
                totalPages: reviewPage?.total_pages ?? 1,
                totalResults: reviewPage?.total_results ?? 0,
                mediaId,
                mediaType,
            },
        };
    }

    private fetchReviewsPage$(
        id: number,
        type: MediaType,
        page: number,
    ): Observable<ReviewPage | null> {
        return type === 'tv'
            ? this.tvSeriesRestControllerService
                  .tvSeriesReviews(
                      id,
                      undefined,
                      page,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                  .pipe(catchError(() => of(null)))
            : this.movieRestControllerService
                  .movieReviews(
                      id,
                      undefined,
                      page,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                  .pipe(catchError(() => of(null)));
    }

    private toCastFromAggregate(
        aggregateCredits: AggregateCredits,
    ): CastCreditWithEpisodes[] {
        return (aggregateCredits.cast ?? []).map((member) => ({
            ...member,
            character: this.toPrimaryLabel(
                (member.roles ?? [])
                    .map((role) => role.character)
                    .filter((character): character is string => !!character),
            ),
            episode_count: this.toAggregateEpisodeCount(member),
        })) as CastCreditWithEpisodes[];
    }

    private toCrewFromAggregate(
        aggregateCredits: AggregateCredits,
    ): CrewCreditWithEpisodes[] {
        return (aggregateCredits.crew ?? []).map((member) => {
            const jobs = [
                ...new Set(
                    (member.jobs ?? [])
                        .map((job) => job.job)
                        .filter((job): job is string => !!job),
                ),
            ];
            return {
                ...member,
                job: this.toPrimaryLabel(jobs),
                episode_count: this.toAggregateEpisodeCount(member),
            } as CrewCreditWithEpisodes;
        });
    }

    private toAggregateEpisodeCount(
        member: AggregateCastMember | AggregateCrewMember,
    ): number | undefined {
        if (typeof member.total_episode_count === 'number') {
            return member.total_episode_count;
        }

        return undefined;
    }

    private toPrimaryLabel(values: string[]): string {
        if (!values.length) {
            return '';
        }
        return (
            values[0] + (values.length > 1 ? ` +${values.length - 1} more` : '')
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

    private toCardItems(
        items: Array<MovieListItem | TvSeriesListItem>,
        mediaType: MediaType,
    ): CardItem[] {
        return items
            .map((item) => ({
                id: item.id ?? 0,
                mediaType,
                title:
                    mediaType === 'movie'
                        ? ((item as MovieListItem).title ?? '')
                        : ((item as TvSeriesListItem).name ?? ''),
                imagePath: item.poster_path ?? null,
                backdropPath: item.backdrop_path ?? null,
                rating: item.vote_average ?? null,
                date:
                    mediaType === 'movie'
                        ? ((item as MovieListItem).release_date ?? '')
                        : ((item as TvSeriesListItem).first_air_date ?? ''),
                overview: item.overview ?? '',
            }))
            .slice(0, PAGE_SIZE);
    }

    private toViewerImages(images: ImageList): ViewerImage[] {
        return [
            ...(images.backdrops ?? []).map((image) => ({
                ...image,
                photoType: 'backdrop',
            })),
            ...(images.posters ?? []).map((image) => ({
                ...image,
                photoType: 'poster',
            })),
        ];
    }

    private detailsRequest$(
        id: number,
        type: MediaType,
    ): Observable<Movie | TvSeries> {
        return iif(
            () => type === 'tv',
            this.tvSeriesRestControllerService.tvSeriesDetails(
                id,
                'external_ids',
                undefined,
                undefined,
                undefined,
                API_JSON_OPTIONS,
            ),
            this.movieRestControllerService.movieDetails(
                id,
                'external_ids',
                undefined,
                undefined,
                undefined,
                API_JSON_OPTIONS,
            ),
        );
    }
}

