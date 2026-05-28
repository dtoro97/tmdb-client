import { catchError, combineLatest, EMPTY, forkJoin, map, Observable, of, tap } from 'rxjs';

import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import {
    CastMember,
    CrewMember,
    TvEpisode,
    TvEpisodeImages,
    TvEpisodeRestControllerService,
    Video,
    VideoList,
} from '../../../api';
import {
    buildImageLanguageFallback,
    getISODate,
    MediaDetails,
    groupCrewMembers,
    LoadableItems,
    LocaleStoreService,
    ViewerImage,
    loadedValue,
    GroupedCrew,
    toYoutubeVideoState,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';

export interface EpisodeDetailState {
    target: EpisodeDetailTarget | null;
    episode: LoadableItems<TvEpisode>;
    images: LoadableItems<TvEpisodeImages>;
    videos: LoadableItems<Video>;
}

interface EpisodeDetailTarget {
    readonly seriesId: number;
    readonly seasonNumber: number;
    readonly episodeNumber: number;
}

const INITIAL_STATE: EpisodeDetailState = {
    target: null,
    episode: { type: 'idle' },
    images: { type: 'idle' },
    videos: { type: 'idle' },
};

export interface EpisodeDetailVm {
    media: MediaDetails | null;
    episode: TvEpisode | null;
    isLoading: boolean;
    canRateEpisode: boolean;
    previousEpisode: TvEpisode | null;
    nextEpisode: TvEpisode | null;
    headerCrew: {
        director: CrewMember | null;
        writer: CrewMember | null;
        hasCrew: boolean;
    };
    groupedCrew: GroupedCrew[];
    guestStars: CastMember[];
    videosState: LoadableItems<Video>;
    videoCount: number;
    stillsState: LoadableItems<ViewerImage>;
    stillsTotalCount: number;
}

@Injectable()
export class EpisodeDetailStoreService extends ComponentStore<EpisodeDetailState> {
    constructor(
        private tvEpisodeRestControllerService: TvEpisodeRestControllerService,
        private mediaSeasonsStoreService: MediaSeasonsStoreService,
        private mediaDetailStoreService: MediaDetailStoreService,
        private localeStore: LocaleStoreService,
    ) {
        super(INITIAL_STATE);
    }

    readonly episodeState$ = this.select((state) => state.episode);

    readonly allStillsState$ = this.select((state): LoadableItems<ViewerImage> => {
        if (state.images.type === 'loading') {
            return { type: 'loading' };
        }

        if (state.images.type !== 'loaded') {
            return { type: 'idle' };
        }

        return {
            type: 'loaded',
            value: this.toEpisodeStillImages(loadedValue(state.images)[0]),
        };
    });

    readonly stillsState$ = this.allStillsState$.pipe(
        map((state): LoadableItems<ViewerImage> => {
            if (state.type !== 'loaded') {
                return state;
            }

            return {
                type: 'loaded',
                value: state.value.slice(0, 12),
            };
        }),
    );

    readonly allStills$ = this.allStillsState$.pipe(map((state) => loadedValue(state)));

    readonly videosState$ = this.select((state): LoadableItems<Video> => {
        if (state.videos.type === 'loading') {
            return { type: 'loading' };
        }

        if (state.videos.type !== 'loaded') {
            return { type: 'idle' };
        }

        return toYoutubeVideoState(state.videos);
    });

    readonly vm$ = combineLatest([
        this.mediaDetailStoreService.mediaDetailsState$,
        this.episodeState$,
        this.mediaSeasonsStoreService.seasonEpisodesState$,
        this.stillsState$,
        this.videosState$,
        this.allStills$,
    ]).pipe(
        map(([mediaState, episodeState, seasonEpisodesState, stillsState, videosState, allStills]): EpisodeDetailVm => {
            const media = mediaState.type === 'loaded' ? mediaState.value : null;
            const episode = loadedValue(episodeState)[0] ?? null;
            const isLoading = episodeState.type === 'idle' || episodeState.type === 'loading';
            const director = episode?.crew?.find((crewMember) => crewMember.job === 'Director') ?? null;
            const writer =
                episode?.crew?.find((crewMember) => crewMember.job === 'Writer' || crewMember.job === 'Screenplay') ??
                null;
            const groupedCrew = groupCrewMembers(episode?.crew ?? []);
            const guestStars = episode?.guest_stars ?? [];
            const stillsTotalCount = allStills.length;
            const youtubeVideoCount = videosState.type === 'loaded' ? videosState.value.length : 0;
            const seasonEpisodes = seasonEpisodesState.type === 'loaded' ? seasonEpisodesState.value : [];
            const episodeIndex = episode
                ? seasonEpisodes.findIndex((seasonEpisode) => seasonEpisode.id === episode.id)
                : -1;
            const previousEpisode = episodeIndex > 0 ? seasonEpisodes[episodeIndex - 1] : null;
            const nextEpisode =
                episodeIndex >= 0 && episodeIndex < seasonEpisodes.length - 1 ? seasonEpisodes[episodeIndex + 1] : null;

            const airDate = episode?.air_date;

            return {
                media,
                episode,
                isLoading,
                canRateEpisode: airDate ? (airDate <= getISODate(0) ? true : false) : false,
                previousEpisode: isLoading ? null : previousEpisode,
                nextEpisode: isLoading ? null : nextEpisode,
                headerCrew: {
                    director,
                    writer,
                    hasCrew: !!director || !!writer,
                },
                groupedCrew,
                guestStars,
                videosState,
                videoCount: youtubeVideoCount,
                stillsState,
                stillsTotalCount,
            };
        }),
    );

    getEpisodeDetails$(
        seriesId: number,
        seasonNumber: number,
        episodeNumber: number,
    ): Observable<[TvEpisode, TvEpisodeImages, VideoList]> {
        const target = { seriesId, seasonNumber, episodeNumber };

        this.patchState({
            target,
            episode: { type: 'loading' },
            images: { type: 'loading' },
            videos: { type: 'loading' },
        });
        const language = this.localeStore.language();
        const includeImageLanguage = buildImageLanguageFallback();

        return forkJoin([
            this.tvEpisodeRestControllerService.tvEpisodeDetails(seriesId, seasonNumber, episodeNumber),
            this.tvEpisodeRestControllerService.tvEpisodeImages(
                seriesId,
                seasonNumber,
                episodeNumber,
                includeImageLanguage,
                language,
            ),
            this.tvEpisodeRestControllerService
                .tvEpisodeVideos(seriesId, seasonNumber, episodeNumber)
                .pipe(catchError(() => of({ results: [] }))),
        ]).pipe(
            tap(([episode, images, videos]) => {
                this.patchState({
                    target,
                    episode: { type: 'loaded', value: [episode] },
                    images: { type: 'loaded', value: [images] },
                    videos: { type: 'loaded', value: videos.results ?? [] },
                });
            }),
            catchError(() => {
                this.patchState({
                    ...INITIAL_STATE,
                });
                return EMPTY;
            }),
        );
    }

    getEpisodeImages$(
        seriesId: number,
        seasonNumber: number,
        episodeNumber: number,
    ): Observable<TvEpisodeImages> {
        const target = { seriesId, seasonNumber, episodeNumber };
        const state = this.get();

        if (this.isCurrentTarget(state.target, target) && state.images.type === 'loaded') {
            return of(state.images.value[0]);
        }

        this.patchState({
            target,
            episode: this.isCurrentTarget(state.target, target) ? state.episode : { type: 'idle' },
            images: { type: 'loading' },
            videos: this.isCurrentTarget(state.target, target) ? state.videos : { type: 'idle' },
        });

        const language = this.localeStore.language();
        const includeImageLanguage = buildImageLanguageFallback();

        return this.tvEpisodeRestControllerService.tvEpisodeImages(
            seriesId,
            seasonNumber,
            episodeNumber,
            includeImageLanguage,
            language,
        ).pipe(
            tap((images) => {
                this.patchState({
                    target,
                    images: { type: 'loaded', value: [images] },
                });
            }),
            catchError(() => {
                this.patchState({
                    images: { type: 'idle' },
                });
                return EMPTY;
            }),
        );
    }

    private isCurrentTarget(current: EpisodeDetailTarget | null, next: EpisodeDetailTarget): boolean {
        return (
            current?.seriesId === next.seriesId &&
            current.seasonNumber === next.seasonNumber &&
            current.episodeNumber === next.episodeNumber
        );
    }

    private toEpisodeStillImages(images: TvEpisodeImages | null | undefined): ViewerImage[] {
        return (images?.stills ?? [])
            .map((image) => ({
                ...image,
                photoType: 'still',
            }));
    }
}
