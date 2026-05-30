import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, forkJoin, map, of, switchMap, take, tap } from 'rxjs';

import {
    CollectionDetails,
    ContentRatingList,
    KeywordList,
    KeywordListItem,
    Movie,
    MovieListItem,
    ReleaseDateList,
    Review,
    TvKeywordList,
    TvSeries,
    TvSeriesListItem,
    Video,
    WatchProviderItem,
    WatchProviderList,
} from '../../api';
import { THEATRICAL_MOVIE_RELEASE_TYPE } from '../../constants';
import {
    CardItem,
    ExternalLinks,
    LocaleStoreService,
    MediaType,
    PersonCardItem,
    RemoteData,
    VideoCardItem,
    ViewerImage,
    getISODate,
    hasRemoteData,
    mapRemoteData,
    remoteSuccess,
    toCardItem,
    toVideoCardItems,
} from '../../shared';
import { MediaCreditsStoreService } from './media-credits-store.service';
import { MediaCreditsResource } from './media-credits-store.service';
import { MediaImagesStoreService } from './media-images-store.service';
import { MediaApiService } from './media-api.service';
import { MediaReviewsStoreService } from './media-reviews-store.service';
import { MediaTarget, isSameMediaTarget } from './media-target';
import { MediaStoreService } from './media-store.service';
import { MediaVideoStoreService } from './media-video-store.service';
import { CreditsSummary } from './media-credits-summary/media-credits-summary.model';
import { MediaDetails } from './models/media-details.model';

export interface MediaDetailPageData {
    readonly media: MediaDetails | null;
    readonly tvYearLabel: string | null;
    readonly canRateTitle: boolean;
    readonly detailsState: RemoteData<MediaDetails | null>;
    readonly photosState: RemoteData<ViewerImage[]>;
    readonly recommendationsState: RemoteData<CardItem[]>;
    readonly similarState: RemoteData<CardItem[]>;
    readonly keywordsState: RemoteData<KeywordListItem[]>;
    readonly certificationState: RemoteData<string | null>;
    readonly watchProviderState: RemoteData<MediaDetailProviderPreview | null>;
    readonly collectionState: RemoteData<CollectionDetails | null>;
    readonly externalLinks: ExternalLinks | null;
    readonly inCinemas: boolean;
    readonly videosState: RemoteData<VideoCardItem[]>;
    readonly trailer: Video | null;
    readonly videoTotalCount: number;
    readonly reviewsState: RemoteData<Review[]>;
    readonly previewReviews: readonly Review[];
    readonly reviewTotalResults: number;
    readonly relatedState: RemoteData<MediaDetailRelatedPreview | null>;
}

export interface MediaDetailRelatedPreview {
    readonly state: RemoteData<CardItem[]>;
}

export interface MediaDetailProviderPreview {
    readonly providers: readonly WatchProviderItem[];
    readonly hiddenCount: number;
    readonly link: string | null;
}

interface MediaReleaseInfo {
    readonly certification: string | null;
    readonly inCinemas: boolean;
}

interface MediaDetailState {
    readonly target: MediaTarget | null;
    readonly recommendationsState: RemoteData<CardItem[]>;
    readonly similarState: RemoteData<CardItem[]>;
    readonly keywordsState: RemoteData<KeywordListItem[]>;
    readonly releaseInfoState: RemoteData<MediaReleaseInfo>;
    readonly watchProviderState: RemoteData<MediaDetailProviderPreview | null>;
    readonly collectionState: RemoteData<CollectionDetails | null>;
}

type RelatedMediaResult = MovieListItem | TvSeriesListItem;

const INITIAL_STATE: MediaDetailState = {
    target: null,
    recommendationsState: { state: 'notAsked' },
    similarState: { state: 'notAsked' },
    keywordsState: { state: 'notAsked' },
    releaseInfoState: { state: 'notAsked' },
    watchProviderState: { state: 'notAsked' },
    collectionState: { state: 'notAsked' },
};

@Injectable()
export class MediaDetailStoreService extends ComponentStore<MediaDetailState> {
    readonly mediaDetailsState$ = this.mediaStore.mediaDetailsState$;

    readonly photosState$ = this.imagesStore.imagesState$;

    private readonly creditsState$ = this.creditsStore.creditsState$;
    private readonly topCastState$ = this.creditsStore.topCastState$;
    private readonly recommendationsState$ = this.select((state) => state.recommendationsState);
    private readonly similarState$ = this.select((state) => state.similarState);
    private readonly keywordsState$ = this.select((state) => state.keywordsState);
    private readonly releaseInfoState$ = this.select((state) => state.releaseInfoState);
    private readonly watchProviderState$ = this.select((state) => state.watchProviderState);
    private readonly collectionState$ = this.select((state) => state.collectionState);
    private readonly externalLinks$ = this.mediaStore.externalLinks$;

    private readonly certificationState$ = this.releaseInfoState$.pipe(
        map((state) => this.toCertificationState(state)),
    );
    private readonly inCinemas$ = this.releaseInfoState$.pipe(
        map((state) => (state.state === 'success' ? state.data.inCinemas : false)),
    );

    readonly creditsSummary$ = this.select(
        this.mediaDetailsState$,
        this.creditsState$,
        this.topCastState$,
        (detailsState, creditsState, topCastState): RemoteData<CreditsSummary | null> =>
            this.toCreditsSummary(detailsState, creditsState, topCastState),
    );

    readonly pageData$ = this.select(
        this.mediaDetailsState$,
        this.photosState$,
        this.recommendationsState$,
        this.similarState$,
        this.keywordsState$,
        this.certificationState$,
        this.watchProviderState$,
        this.collectionState$,
        this.externalLinks$,
        this.inCinemas$,
        this.videoStore.videosState$,
        this.videoStore.trailer$,
        this.videoStore.youtubeVideosTotalCount$,
        this.reviewsStore.reviewsState$,
        this.reviewsStore.previewReviews$,
        this.reviewsStore.totalResults$,
        (
            detailsState,
            photosState,
            recommendationsState,
            similarState,
            keywordsState,
            certificationState,
            watchProviderState,
            collectionState,
            externalLinks,
            inCinemas,
            videosState,
            trailer,
            videoTotalCount,
            reviewsState,
            previewReviews,
            reviewTotalResults,
        ): MediaDetailPageData => {
            const media = detailsState.state === 'success' ? detailsState.data : null;

            return {
                media,
                tvYearLabel: media ? this.toTvYearLabel(media) : null,
                canRateTitle: media ? this.canRateTitle(media) : false,
                detailsState,
                photosState,
                recommendationsState,
                similarState,
                keywordsState,
                certificationState,
                watchProviderState,
                collectionState,
                externalLinks,
                inCinemas,
                videosState: this.toVideoItemsState(videosState, media),
                trailer,
                videoTotalCount,
                reviewsState,
                previewReviews,
                reviewTotalResults,
                relatedState: this.toRelatedState(recommendationsState, similarState),
            };
        },
    );

    readonly openOverview = this.effect<MediaTarget>((target$) =>
        target$.pipe(switchMap((target) => this.loadOverview$(target))),
    );

    constructor(
        private readonly creditsStore: MediaCreditsStoreService,
        private readonly imagesStore: MediaImagesStoreService,
        private readonly localeStore: LocaleStoreService,
        private readonly mediaApiService: MediaApiService,
        private readonly mediaStore: MediaStoreService,
        private readonly reviewsStore: MediaReviewsStoreService,
        private readonly videoStore: MediaVideoStoreService,
    ) {
        super(INITIAL_STATE);
    }

    loadOverview$(target: MediaTarget): Observable<unknown> {
        this.prepareTarget(target);

        const collection$ = this.mediaStore.load$(target).pipe(
            switchMap((details) => {
                if (!details) {
                    this.patchState({ collectionState: { state: 'success', data: null } });
                    return of(null);
                }

                const currentMedia = this.mediaStore.currentMedia();
                const collectionId = this.extractCollectionId(currentMedia, target);

                return this.loadCollection$(target, collectionId, currentMedia);
            }),
        );

        return forkJoin([
            collection$,
            this.creditsStore.load$(target),
            this.imagesStore.load$(target),
            this.videoStore.load$(target),
            this.reviewsStore.load$(target),
            this.loadRecommendations$(target),
            this.loadSimilar$(target),
            this.loadKeywords$(target),
            this.loadReleaseInfo$(target),
            this.loadWatchProviders$(target),
        ]).pipe(map(() => undefined));
    }

    private prepareTarget(target: MediaTarget): void {
        if (isSameMediaTarget(this.get().target, target)) {
            return;
        }

        this.setState({
            ...INITIAL_STATE,
            target,
        });
    }

    private loadRecommendations$(target: MediaTarget): Observable<CardItem[]> {
        const current = this.get().recommendationsState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.recommendationsState$);
        }

        this.patchState({ recommendationsState: { state: 'loading' } });

        return this.mediaApiService.getRecommendations$(target).pipe(
            map((page) => this.toCardItems(page.results ?? [], target.type)),
            tap((recommendations) => {
                this.patchState({ recommendationsState: { state: 'success', data: recommendations } });
            }),
            catchError(() => {
                this.patchState({ recommendationsState: { state: 'success', data: [] } });
                return of([]);
            }),
        );
    }

    private loadSimilar$(target: MediaTarget): Observable<CardItem[]> {
        const current = this.get().similarState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.similarState$);
        }

        this.patchState({ similarState: { state: 'loading' } });

        return this.mediaApiService.getSimilar$(target).pipe(
            map((page) => this.toCardItems(page.results ?? [], target.type)),
            tap((similar) => {
                this.patchState({ similarState: { state: 'success', data: similar } });
            }),
            catchError(() => {
                this.patchState({ similarState: { state: 'success', data: [] } });
                return of([]);
            }),
        );
    }

    private loadKeywords$(target: MediaTarget): Observable<KeywordListItem[]> {
        const current = this.get().keywordsState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.keywordsState$);
        }

        this.patchState({ keywordsState: { state: 'loading' } });

        return this.mediaApiService.getKeywords$(target).pipe(
            map((response) => this.extractKeywords(response)),
            tap((keywords) => {
                this.patchState({ keywordsState: { state: 'success', data: keywords } });
            }),
            catchError(() => {
                this.patchState({ keywordsState: { state: 'success', data: [] } });
                return of([]);
            }),
        );
    }

    private loadReleaseInfo$(target: MediaTarget): Observable<MediaReleaseInfo> {
        const current = this.get().releaseInfoState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.releaseInfoState$);
        }

        this.patchState({ releaseInfoState: { state: 'loading' } });

        const request$: Observable<ContentRatingList | ReleaseDateList> =
            target.type === 'tv'
                ? this.mediaApiService.getTvContentRatings$(target.id)
                : this.mediaApiService.getMovieReleaseDates$(target.id);

        return request$.pipe(
            map((response) =>
                target.type === 'tv'
                    ? this.toTvReleaseInfo(response as ContentRatingList)
                    : this.toMovieReleaseInfo(response as ReleaseDateList),
            ),
            tap((releaseInfo) => {
                this.patchState({ releaseInfoState: { state: 'success', data: releaseInfo } });
            }),
            catchError(() => {
                const releaseInfo = this.toTvReleaseInfo(null);
                this.patchState({ releaseInfoState: { state: 'success', data: releaseInfo } });
                return of(releaseInfo);
            }),
        );
    }

    private loadWatchProviders$(target: MediaTarget): Observable<MediaDetailProviderPreview | null> {
        const current = this.get().watchProviderState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.watchProviderState$);
        }

        this.patchState({ watchProviderState: { state: 'loading' } });

        return this.mediaApiService.getWatchProviders$(target).pipe(
            map((response) => this.extractWatchProviderPreview(response)),
            tap((watchProvider) => {
                this.patchState({ watchProviderState: { state: 'success', data: watchProvider } });
            }),
            catchError(() => {
                this.patchState({ watchProviderState: { state: 'success', data: null } });
                return of(null);
            }),
        );
    }

    private loadCollection$(
        target: MediaTarget,
        collectionId: number | null,
        media: Movie | TvSeries | null,
    ): Observable<CollectionDetails | null> {
        const current = this.get().collectionState;

        if (current.state === 'success') {
            return of(current.data);
        }

        if (current.state === 'loading') {
            return this.resourceReady$(this.collectionState$);
        }

        if (target.type !== 'movie' || !collectionId) {
            this.patchState({ collectionState: { state: 'success', data: null } });
            return of(null);
        }

        this.patchState({ collectionState: { state: 'loading' } });

        return this.mediaApiService.getCollectionDetails$(collectionId).pipe(
            map((collection) => ({
                ...collection,
                backdrop_path: collection.backdrop_path ?? media?.backdrop_path ?? null,
            })),
            tap((collection) => {
                this.patchState({ collectionState: { state: 'success', data: collection } });
            }),
            catchError(() => {
                this.patchState({ collectionState: { state: 'success', data: null } });
                return of(null);
            }),
        );
    }

    private toVideoItemsState(
        videosState: RemoteData<Video[]>,
        media: MediaDetails | null,
    ): RemoteData<VideoCardItem[]> {
        return mapRemoteData(videosState, (videos) => (media ? toVideoCardItems(videos, media) : []));
    }

    private toCertificationState(state: RemoteData<MediaReleaseInfo>): RemoteData<string | null> {
        return mapRemoteData(state, (releaseInfo) => releaseInfo.certification);
    }

    private toRelatedState(
        recommendations: RemoteData<CardItem[]>,
        similar: RemoteData<CardItem[]>,
    ): RemoteData<MediaDetailRelatedPreview | null> {
        if (recommendations.state === 'loading' || similar.state === 'loading') {
            return { state: 'loading' };
        }

        const state = hasRemoteData(recommendations) && recommendations.data.length ? recommendations : similar;
        return remoteSuccess(hasRemoteData(state) && state.data.length ? { state } : null);
    }

    private toTvYearLabel(media: MediaDetails): string | null {
        if (media.mediaType !== 'tv') {
            return null;
        }

        const first = media.firstAirDate?.slice(0, 4) || media.year;
        const last = media.lastAirDate?.slice(0, 4);

        if (!first) {
            return null;
        }

        return !last || first === last ? first : `${first} - ${last}`;
    }

    private canRateTitle(media: MediaDetails): boolean {
        const primaryReleaseDate = media.releaseDate ?? media.firstAirDate ?? null;
        return !primaryReleaseDate || primaryReleaseDate <= getISODate(0);
    }

    private resourceReady$<T>(state$: Observable<RemoteData<T>>): Observable<T> {
        return state$.pipe(
            filter((state): state is Extract<RemoteData<T>, { state: 'success' }> => state.state === 'success'),
            take(1),
            map((state) => state.data),
        );
    }

    private toCardItems(items: RelatedMediaResult[], mediaType: MediaType): CardItem[] {
        return items.map((item) => toCardItem(item, mediaType));
    }

    private extractCollectionId(media: Movie | TvSeries | null, target: MediaTarget): number | null {
        return target.type === 'movie' ? ((media as Movie | null)?.belongs_to_collection?.id ?? null) : null;
    }

    private extractKeywords(response: KeywordList | TvKeywordList | null | undefined): KeywordListItem[] {
        const keywordResponse = response as (KeywordList & TvKeywordList) | null | undefined;
        const keywords = keywordResponse?.keywords ?? keywordResponse?.results ?? [];
        return keywords || [];
    }

    private toTvReleaseInfo(response: ContentRatingList | null | undefined): MediaReleaseInfo {
        return {
            certification: this.extractTvCertification(response),
            inCinemas: false,
        };
    }

    private toMovieReleaseInfo(response: ReleaseDateList | null | undefined): MediaReleaseInfo {
        return {
            certification: this.extractMovieCertification(response),
            inCinemas: this.isInCinemaWindow(response),
        };
    }

    private extractTvCertification(response: ContentRatingList | null | undefined): string | null {
        const country = this.localeStore.region();
        const ratings = response?.results ?? [];

        return (
            ratings.find((item) => item.iso_3166_1 === country && !!item.rating)?.rating ??
            ratings.find((item) => item.iso_3166_1 === 'US' && !!item.rating)?.rating ??
            ratings.find((item) => !!item.rating)?.rating ??
            null
        );
    }

    private extractMovieCertification(response: ReleaseDateList | null | undefined): string | null {
        const country = this.localeStore.region();
        const releases = response?.results ?? [];
        const countryReleases =
            releases.find((item) => item.iso_3166_1 === country)?.release_dates ??
            releases.find((item) => item.iso_3166_1 === 'US')?.release_dates ??
            releases.find((item) => !!item.release_dates?.length)?.release_dates ??
            [];
        const release =
            countryReleases.find((item) => item.type === THEATRICAL_MOVIE_RELEASE_TYPE && !!item.certification) ??
            countryReleases.find((item) => !!item.certification);

        return release?.certification || null;
    }

    private isInCinemaWindow(response: ReleaseDateList | null | undefined): boolean {
        const startDate = getISODate(-15);
        const today = getISODate(15);
        const releaseDates = (response?.results ?? []).flatMap((region) => region.release_dates ?? []);

        return releaseDates.some((release) => {
            const releaseDate = release.release_date?.slice(0, 10);

            return (
                releaseDate &&
                release.type === THEATRICAL_MOVIE_RELEASE_TYPE &&
                releaseDate >= startDate &&
                releaseDate <= today
            );
        });
    }

    private extractWatchProviderPreview(
        response: WatchProviderList | null | undefined,
    ): MediaDetailProviderPreview | null {
        const item = response?.results?.[this.localeStore.region()];
        const providers = item?.flatrate ?? [];

        if (!providers.length) {
            return null;
        }

        return {
            providers: providers.slice(0, 3),
            hiddenCount: Math.max(0, providers.length - 3),
            link: item?.link ?? null,
        };
    }

    private toCreditsSummary(
        detailsState: RemoteData<MediaDetails | null>,
        creditsState: RemoteData<MediaCreditsResource>,
        topCastState: RemoteData<PersonCardItem[]>,
    ): RemoteData<CreditsSummary | null> {
        if (
            detailsState.state !== 'success' ||
            creditsState.state === 'notAsked' ||
            creditsState.state === 'loading'
        ) {
            return { state: 'loading' };
        }

        const media = detailsState.data;
        const cast = hasRemoteData(creditsState) ? creditsState.data.cast : [];
        const crew = hasRemoteData(creditsState) ? creditsState.data.crew : [];
        const creators = media?.creators ?? [];

        if (!media || (!cast.length && !crew.length && !creators.length)) {
            return { state: 'success', data: null };
        }

        return {
            state: 'success',
            data: {
                topCastState,
                directors: crew
                    .filter((member) => member.job === 'Director')
                    .map((member) => ({ id: member.id, name: member.name })),
                creators: creators.map((creator) => ({ id: creator.id, name: creator.name })),
            },
        };
    }
}
