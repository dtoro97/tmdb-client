import { catchError, combineLatest, delay, EMPTY, filter, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

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
    ReleaseDate,
    ReleaseDateList,
    Review,
    TvEpisode,
    TvSeries,
    TvSeriesListItem,
    Video,
    WatchProviderItem,
    WatchProviderList,
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
    getISODate,
    isDefined,
    loaded,
    loadedItems,
    toCastPersonCardItem,
    toCardItem,
    toMediaDetails,
    toYear,
    LocaleStoreService,
} from '../../shared';
import {
    CastCreditWithEpisodes,
    CrewCreditWithEpisodes,
    MediaCreditsLinkItem,
    MediaCreditsPanelData,
    MediaDetailProviderPreview,
} from './media-detail.models';
import { toCastFromAggregate, toCrewFromAggregate } from './media-detail-credits.mapper';
import { rankRelatedMedia } from './media-detail-recommendations.mapper';
import { MediaApiService } from './media-api.service';
import { MediaReviewsStoreService } from './media-reviews-store.service';
import { MediaVideoStoreService } from './media-video-store.service';

const TOP_CAST_PREVIEW_COUNT = 20;
const CINEMA_RELEASE_TYPES = new Set([2, 3]);
const CINEMA_WINDOW_DAYS = 30;

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
    watchProviders: LoadableValue<MediaDetailProviderPreview | null>;
    certification: LoadableValue<string | null>;
    inCinemas: boolean;
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
    inCinemas: false,
};

@Injectable()
export class MediaDetailStoreService extends ComponentStore<MediaState> {
    private readonly rawMediaState$ = this.select((state) => state.media);
    readonly rawMedia$ = this.rawMediaState$.pipe(map((state) => (state.type === 'loaded' ? state.value : null)));
    private readonly type$ = this.select((state) => state.type).pipe(filter((type): type is MediaType => !!type));

    readonly castState$ = this.select((state) => state.cast);
    readonly crewState$ = this.select((state) => state.crew);
    readonly recommendationsState$ = this.select((state) => state.recommendations);
    readonly photosState$ = this.select((state) => state.photos);
    private readonly keywordsState$ = this.select((state) => state.keywords);
    private readonly collectionState$ = this.select((state) => state.collection);
    private readonly watchProvidersState$ = this.select((state) => state.watchProviders);
    private readonly certificationState$ = this.select((state) => state.certification);
    private readonly inCinemas$ = this.select((state) => state.inCinemas);
    private readonly externalLinks$ = this.select((state) => state.externalLinks);

    private readonly topCastState$ = this.castState$.pipe(
        map((state): LoadableItems<PersonCardItem> => {
            if (state.type === 'loading-more') {
                return {
                    type: 'loading-more',
                    value: state.value.slice(0, TOP_CAST_PREVIEW_COUNT).map((member) => toCastPersonCardItem(member)),
                    placeholderCount: state.placeholderCount,
                };
            }

            if (state.type === 'loaded') {
                return loaded(
                    state.value.slice(0, TOP_CAST_PREVIEW_COUNT).map((member) => toCastPersonCardItem(member)),
                );
            }

            return state;
        }),
    );

    readonly cast$: Observable<CastCreditWithEpisodes[]> = this.castState$.pipe(map((state) => loadedItems(state)));
    readonly crew$: Observable<CrewCreditWithEpisodes[]> = this.crewState$.pipe(map((state) => loadedItems(state)));
    readonly castCrew$ = combineLatest([this.cast$, this.crew$]).pipe(map(([cast, crew]) => ({ cast, crew })));
    private readonly directors$ = this.crew$.pipe(
        map((crew) =>
            crew.reduce<MediaCreditsLinkItem[]>((directors, member) => {
                if (member.job === 'Director' && !directors.some((director) => director.id === member.id)) {
                    directors.push({
                        id: member.id,
                        name: member.name,
                    });
                }

                return directors;
            }, []),
        ),
    );
    readonly recommendations$ = this.recommendationsState$.pipe(map((state) => loadedItems(state)));
    readonly allPhotos$ = this.photosState$.pipe(map((state) => loadedItems(state)));

    readonly mediaDetailsState$: Observable<LoadableValue<MediaDetails | null>> = combineLatest([
        this.rawMediaState$,
        this.type$,
        this.configStoreService.languages$,
    ]).pipe(
        map(([mediaState, type, languages]) => {
            if (mediaState.type !== 'loaded') {
                return { type: mediaState.type };
            }

            return loaded(mediaState.value ? toMediaDetails(mediaState.value, type, languages) : null);
        }),
    );

    readonly mediaDetails$: Observable<MediaDetails> = this.mediaDetailsState$.pipe(
        map((state) => (state.type === 'loaded' ? state.value : null)),
        filter(isDefined),
    );

    readonly title$ = this.mediaDetails$.pipe(map((media) => media.title));

    readonly mediaDetailVm$ = combineLatest({
        mediaDetailsState: this.mediaDetailsState$,
        topCastState: this.topCastState$,
        castState: this.castState$,
        crewState: this.crewState$,
        directors: this.directors$,
        externalLinks: this.externalLinks$,
        certification: this.certificationState$,
        inCinemas: this.inCinemas$,
        watchProviders: this.watchProvidersState$,
        collection: this.collectionState$,
        photosState: this.photosState$,
        recommendationsState: this.recommendationsState$,
        keywordsState: this.keywordsState$,
        videosState: this.mediaVideoStoreService.videosState$,
        trailer: this.mediaVideoStoreService.trailer$,
        videoTotalCount: this.mediaVideoStoreService.youtubeVideosTotalCount$,
        reviewsState: this.mediaReviewsStoreService.reviewsState$,
        reviewPreview: this.mediaReviewsStoreService.previewReviews$,
        reviewTotalResults: this.mediaReviewsStoreService.totalResults$,
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
                inCinemas,
                watchProviders,
                collection,
                photosState,
                recommendationsState,
                keywordsState,
                videosState,
                trailer,
                videoTotalCount,
                reviewsState,
                reviewPreview,
                reviewTotalResults,
            }) => {
                const media = mediaDetailsState.type === 'loaded' ? mediaDetailsState.value : null;
                const castItems =
                    castState.type === 'loaded' || castState.type === 'loading-more' ? castState.value : [];
                const crewItems =
                    crewState.type === 'loaded' || crewState.type === 'loading-more' ? crewState.value : [];
                const photoItems =
                    photosState.type === 'loaded' || photosState.type === 'loading-more' ? photosState.value : [];
                const reviewsItems =
                    reviewsState.type === 'loaded' || reviewsState.type === 'loading-more' ? reviewsState.value : [];
                const credits =
                    mediaDetailsState.type !== 'loaded' ||
                    castState.type === 'idle' ||
                    castState.type === 'loading' ||
                    crewState.type === 'idle' ||
                    crewState.type === 'loading'
                        ? ({ type: 'loading' } as LoadableValue<MediaCreditsPanelData | null>)
                        : !media
                          ? loaded(null)
                          : !castItems.length && !crewItems.length && !(media.creators?.length ?? 0)
                            ? loaded(null)
                            : loaded({
                                  topCastState,
                                  castState,
                                  crewState,
                                  directors,
                                  creators: media.creators ?? [],
                              });
                const videos =
                    videosState.type === 'idle' || videosState.type === 'loading'
                        ? ({ type: 'loading' } as LoadableValue<{
                              state: LoadableItems<Video>;
                              totalCount: number;
                              trailerKey: string | null;
                          } | null>)
                        : !videoTotalCount
                          ? loaded(null)
                          : loaded({
                                state: videosState,
                                totalCount: videoTotalCount,
                                trailerKey: trailer?.key ?? null,
                            });
                const photos =
                    photosState.type === 'idle' || photosState.type === 'loading'
                        ? ({ type: 'loading' } as LoadableValue<{
                              state: LoadableItems<ViewerImage>;
                              allPhotos: ViewerImage[];
                              totalCount: number;
                          } | null>)
                        : !photoItems.length
                          ? loaded(null)
                          : loaded({
                                state: photosState,
                                allPhotos: photoItems,
                                totalCount: photoItems.length,
                            });
                const reviews =
                    reviewsState.type === 'idle' || reviewsState.type === 'loading'
                          ? ({ type: 'loading' } as LoadableValue<{
                              state: LoadableItems<Review>;
                              previewReviews: Review[];
                              totalResults: number;
                          } | null>)
                        : !reviewsItems.length
                          ? loaded(null)
                          : loaded({
                                state: reviewsState,
                                previewReviews: reviewPreview,
                                totalResults: reviewTotalResults,
                            });
                const recommendations =
                    recommendationsState.type === 'idle' || recommendationsState.type === 'loading'
                        ? ({ type: 'loading' } as LoadableValue<{ state: LoadableItems<CardItem> } | null>)
                        : loaded(loadedItems(recommendationsState).length ? { state: recommendationsState } : null);
                const keywords =
                    keywordsState.type === 'idle' || keywordsState.type === 'loading'
                        ? ({ type: 'loading' } as LoadableValue<KeywordListItem[] | null>)
                        : loaded(loadedItems(keywordsState).length ? loadedItems(keywordsState) : null);
                const primaryReleaseDate = media?.releaseDate ?? media?.firstAirDate ?? null;

                return {
                    mediaState: mediaDetailsState,
                    media,
                    inCinemas,
                    hero: {
                        canRateTitle: media ? !primaryReleaseDate || primaryReleaseDate <= getISODate(0) : false,
                        tvYearLabel: media
                            ? media.mediaType !== 'tv'
                                ? null
                                : (() => {
                                      const first = toYear(media.firstAirDate);
                                      const last = toYear(media.lastAirDate);

                                      if (!first) {
                                          return null;
                                      }

                                      return !last || first === last ? first : `${first} - ${last}`;
                                  })()
                            : null,
                        externalLinks,
                        certification,
                        watchProviders,
                    },
                    credits,
                    collection,
                    latestEpisode: loaded(media?.lastEpisode ? (media.lastEpisode as TvEpisode) : null),
                    videos,
                    photos,
                    reviews,
                    recommendations,
                    keywords,
                };
            },
        ),
    );

    readonly loadPage = this.effect<{ id: number; type: MediaType }>((params$) =>
        params$.pipe(
            tap(() => {
                this.resetState();
                this.mediaReviewsStoreService.resetState();
                this.mediaVideoStoreService.resetState();
            }),
            switchMap(({ id, type }) => {
                const mediaType = type === 'tv' ? 'tv' : 'movie';
                this.patchState({
                    mediaId: id,
                    type: mediaType,
                    media: { type: 'loading' },
                    cast: { type: 'loading' },
                    crew: { type: 'loading' },
                    recommendations: { type: 'loading' },
                    photos: { type: 'loading' },
                    keywords: { type: 'loading' },
                    collection: { type: 'loading' },
                    watchProviders: { type: 'loading' },
                    certification: { type: 'loading' },
                    inCinemas: false,
                    externalLinks: null,
                });

                return this.mediaApiService.getDetails$(id, mediaType).pipe(
                    delay(1000),
                    tap((media) => {
                        const externalIds = (
                            media as (Movie | TvSeries) & {
                                external_ids?: ExternalIds;
                            }
                        ).external_ids;

                        this.patchState({
                            media: loaded(media),
                            externalLinks: buildExternalLinks(externalIds ?? null, media.homepage ?? null, 'title'),
                        });

                        this.loadSupplementaryData({
                            id,
                            type: mediaType,
                            media,
                        });
                    }),
                    catchError(() => {
                        this.router.navigate(['not-found']);
                        return EMPTY;
                    }),
                );
            }),
        ),
    );

    private readonly loadSupplementaryData = this.effect<{
        id: number;
        type: MediaType;
        media: Movie | TvSeries;
    }>((params$) =>
        params$.pipe(
            switchMap(({ id, type, media }) =>
                forkJoin({
                    credits: this.fetchCredits$(id, type),
                    recommendations: this.fetchRecommendations$(id, type, media),
                    photos: this.fetchPhotos$(id, type),
                    keywords: this.fetchKeywords$(id, type),
                    watchProviders: this.fetchWatchProviders$(id, type, this.localStoreService.region()),
                    certification: this.fetchCertification$(id, type, this.localStoreService.region()),
                    collection: this.fetchCollection$(media),
                    reviews: this.mediaReviewsStoreService.loadReviews$(id, type),
                    videos: this.mediaVideoStoreService.getVideos$(id, type),
                }).pipe(catchError(() => EMPTY)),
            ),
        ),
    );

    constructor(
        private readonly mediaApiService: MediaApiService,
        private readonly collectionRestControllerService: CollectionRestControllerService,
        private readonly configStoreService: ConfigStoreService,
        private readonly router: Router,
        private readonly localStoreService: LocaleStoreService,
        private readonly mediaReviewsStoreService: MediaReviewsStoreService,
        private readonly mediaVideoStoreService: MediaVideoStoreService,
    ) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    private fetchCredits$(id: number, type: MediaType): Observable<Credits | AggregateCredits> {
        return this.mediaApiService.getCredits$(id, type).pipe(
            catchError(() => of({ cast: [], crew: [] } as Credits)),
            tap((credits) => {
                const isAggregate = type === 'tv';
                this.patchState({
                    cast: loaded(
                        isAggregate
                            ? toCastFromAggregate(credits as AggregateCredits)
                            : (((credits as Credits).cast ?? []) as CastCreditWithEpisodes[]),
                    ),
                    crew: loaded(
                        isAggregate
                            ? toCrewFromAggregate(credits as AggregateCredits)
                            : (((credits as Credits).crew ?? []) as CrewCreditWithEpisodes[]),
                    ),
                });
            }),
        );
    }

    private fetchRecommendations$(
        id: number,
        type: MediaType,
        sourceMedia: Movie | TvSeries,
    ): Observable<{
        similar: { results?: unknown[] };
        recommendations: { results?: unknown[] };
    }> {
        return forkJoin({
            similar: this.mediaApiService.getSimilar$(id, type).pipe(catchError(() => of({ results: [] }))),
            recommendations: this.mediaApiService
                .getRecommendations$(id, type)
                .pipe(catchError(() => of({ results: [] }))),
        }).pipe(
            tap(({ similar, recommendations }) => {
                const rankedItems = rankRelatedMedia(
                    sourceMedia,
                    type,
                    (similar.results ?? []) as (MovieListItem | TvSeriesListItem)[],
                    (recommendations.results ?? []) as (MovieListItem | TvSeriesListItem)[],
                    PAGE_SIZE,
                );

                this.patchState({
                    recommendations: loaded(rankedItems.slice(0, PAGE_SIZE).map((item) => toCardItem(item, type))),
                });
            }),
        );
    }

    private fetchPhotos$(id: number, type: MediaType): Observable<ImageList> {
        return this.mediaApiService.getImages$(id, type).pipe(
            catchError(() => of({} as ImageList)),
            tap((images) => {
                const language = this.localStoreService.language() || 'en';
                this.patchState({
                    photos: loaded([
                        ...(images.backdrops ?? [])
                            .filter(
                                (image) =>
                                    image.iso_639_1 === null ||
                                    image.iso_639_1 === language ||
                                    image.iso_639_1 === 'en',
                            )
                            .map((image) => ({
                                ...image,
                                photoType: 'backdrop' as const,
                            })),
                        ...(images.posters ?? [])
                            .filter(
                                (image) =>
                                    image.iso_639_1 === null ||
                                    image.iso_639_1 === language ||
                                    image.iso_639_1 === 'en',
                            )
                            .map((image) => ({
                                ...image,
                                photoType: 'poster' as const,
                            })),
                    ]),
                });
            }),
        );
    }

    private fetchKeywords$(id: number, type: MediaType): Observable<{ results?: unknown[]; keywords?: unknown[] }> {
        return this.mediaApiService.getKeywords$(id, type).pipe(
            catchError(() => of({ results: [], keywords: [] })),
            tap((response) => {
                const items = ((type === 'tv' ? response.results : response.keywords) ?? []) as KeywordListItem[];
                this.patchState({
                    keywords: loaded(items.filter((keyword) => !!keyword.id && !!keyword.name)),
                });
            }),
        );
    }

    private fetchWatchProviders$(id: number, type: MediaType, country: string): Observable<WatchProviderList | null> {
        return this.mediaApiService.getWatchProviders$(id, type).pipe(
            catchError(() => of(null)),
            tap((providers) => {
                this.patchState({
                    watchProviders: loaded(this.toWatchProviderPreview(providers, country)),
                });
            }),
        );
    }

    private fetchCertification$(
        id: number,
        type: MediaType,
        country: string,
    ): Observable<ContentRatingList | ReleaseDateList | null> {
        return this.mediaApiService.getCertification$(id, type).pipe(
            catchError(() => of(null)),
            tap((response) => {
                let value: string | null = null;

                if (type === 'tv') {
                    value =
                        ((response as ContentRatingList | null)?.results ?? [])
                            .find((rating) => rating.iso_3166_1 === country)
                            ?.rating?.trim() || null;
                } else {
                    const regionReleaseDates =
                        ((response as ReleaseDateList | null)?.results ?? []).find(
                            (releaseDates) => releaseDates.iso_3166_1 === country,
                        )?.release_dates ?? [];

                    value =
                        regionReleaseDates
                            .map((release) => release.certification?.trim())
                            .find((certification): certification is string => !!certification) ?? null;

                    this.patchState({
                        inCinemas: isInCinemaWindow(regionReleaseDates),
                    });
                }

                this.patchState({
                    certification: loaded(value),
                });
            }),
        );
    }

    private fetchCollection$(media: Movie | TvSeries): Observable<CollectionDetails | null> {
        const collectionId = (media as Movie).belongs_to_collection?.id;

        if (!collectionId) {
            this.patchState({
                collection: loaded(null),
            });

            return of(null);
        }

        return this.collectionRestControllerService
            .collectionDetails(collectionId, undefined, undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                tap((collection) => {
                    this.patchState({
                        collection: loaded(collection),
                    });
                }),
                catchError(() => {
                    this.patchState({
                        collection: loaded(null),
                    });

                    return of(null);
                }),
            );
    }

    private toWatchProviderPreview(providers: WatchProviderList | null, country: string) {
        const results = providers?.results ?? {};
        const region = (results[country] && country) || (results['US'] && 'US') || Object.keys(results)[0];

        if (!region) {
            return null;
        }

        const seen = new Set<number>();
        const previewProviders = [results[region].flatrate, results[region].rent, results[region].buy]
            .flatMap((items) => items ?? [])
            .filter(
                (provider): provider is WatchProviderItem =>
                    !!provider.provider_id && !!provider.provider_name && !!provider.logo_path,
            )
            .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
            .filter((provider) => {
                if (seen.has(provider.provider_id!)) {
                    return false;
                }

                seen.add(provider.provider_id!);
                return true;
            });

        if (!previewProviders.length) {
            return null;
        }

        return {
            providers: previewProviders.slice(0, 3),
            hiddenCount: Math.max(0, previewProviders.length - 3),
            link: results[region].link ?? null,
        };
    }
}

const isInCinemaWindow = (releaseDates: readonly ReleaseDate[]): boolean => {
    const startDate = getISODate(-CINEMA_WINDOW_DAYS);
    const today = getISODate(0);

    return releaseDates.some((release) => {
        const releaseDate = release.release_date?.slice(0, 10);

        return (
            !!releaseDate &&
            !!release.type &&
            CINEMA_RELEASE_TYPES.has(release.type) &&
            releaseDate >= startDate &&
            releaseDate <= today
        );
    });
};
