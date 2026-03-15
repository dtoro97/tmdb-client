import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import {
    MovieListItem,
    MovieListRestControllerService,
    MovieRestControllerService,
    TrendingRestControllerService,
    TvSeriesListItem,
    TvSeriesListRestControllerService,
    TvSeriesRestControllerService,
    Video,
} from '../../../api';
import { isDefined, shuffle, VideoCardItem } from '../../../shared';

interface TrailerSeed {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    mediaTitle: string;
    mediaYear: string;
    mediaPosterPath: string | null;
}

interface TrailersPageState {
    loading: boolean;
    trendingTrailers: VideoCardItem[];
    popularTrailers: VideoCardItem[];
}

const INITIAL_STATE: TrailersPageState = {
    loading: true,
    trendingTrailers: [],
    popularTrailers: [],
};

@Injectable()
export class TrailersPageStoreService extends ComponentStore<TrailersPageState> {
    readonly vm$ = this.select((state) => ({
        loading: state.loading,
        trendingTrailers: state.trendingTrailers,
        popularTrailers: state.popularTrailers,
    }));

    private readonly opts = { httpHeaderAccept: 'application/json' as const };
    private readonly defaultRegion = 'US';

    constructor(
        private trendingService: TrendingRestControllerService,
        private movieListService: MovieListRestControllerService,
        private tvListService: TvSeriesListRestControllerService,
        private movieService: MovieRestControllerService,
        private tvService: TvSeriesRestControllerService,
    ) {
        super(INITIAL_STATE);
        this.load();
    }

    private load(): void {
        this.patchState({ loading: true });
        forkJoin({
            trendingMovies: this.trendingService.trendingMovies(
                'week',
                undefined,
                'body',
                undefined,
                this.opts,
            ),
            trendingTv: this.trendingService.trendingTv(
                'week',
                undefined,
                'body',
                undefined,
                this.opts,
            ),
            popularMovies: this.movieListService.moviePopularList(
                undefined,
                1,
                this.defaultRegion,
                'body',
                undefined,
                this.opts,
            ),
            popularTv: this.tvListService.tvSeriesPopularList(
                undefined,
                1,
                'body',
                undefined,
                this.opts,
            ),
        })
            .pipe(
                switchMap(
                    ({ trendingMovies, trendingTv, popularMovies, popularTv }) =>
                        forkJoin({
                            trendingTrailers: this.loadTrailersForSeeds(
                                shuffle([
                                    ...(trendingMovies.results ?? []).map((movie) =>
                                        this.toMovieSeed(movie),
                                    ),
                                    ...(trendingTv.results ?? []).map((tv) =>
                                        this.toTvSeed(tv),
                                    ),
                                ])
                                    .filter((seed) => seed.mediaId > 0)
                                    .slice(0, 56),
                            ),
                            popularTrailers: this.loadTrailersForSeeds(
                                shuffle([
                                    ...(popularMovies.results ?? []).map((movie) =>
                                        this.toMovieSeed(movie),
                                    ),
                                    ...(popularTv.results ?? []).map((tv) =>
                                        this.toTvSeed(tv),
                                    ),
                                ])
                                    .filter((seed) => seed.mediaId > 0)
                                    .slice(0, 56),
                            ),
                        }),
                ),
                catchError(() =>
                    of({
                        trendingTrailers: [] as VideoCardItem[],
                        popularTrailers: [] as VideoCardItem[],
                    }),
                ),
                finalize(() => this.patchState({ loading: false })),
            )
            .subscribe(({ trendingTrailers, popularTrailers }) =>
                this.patchState({ trendingTrailers, popularTrailers }),
            );
    }

    private loadTrailersForSeeds(
        seeds: TrailerSeed[],
    ): Observable<VideoCardItem[]> {
        if (!seeds.length) {
            return of([]);
        }

        return forkJoin(
            seeds.map((seed) =>
                (seed.mediaType === 'movie'
                    ? this.movieService.movieVideos(
                          seed.mediaId,
                          undefined,
                          'body',
                          undefined,
                          this.opts,
                      )
                    : this.tvService.tvSeriesVideos(
                          seed.mediaId,
                          undefined,
                          undefined,
                          'body',
                          undefined,
                          this.opts,
                      )
                ).pipe(
                    map((response) => ({
                        seed,
                        bestVideo: this.pickBestTrailer(response.results ?? []),
                    })),
                    catchError(() => of({ seed, bestVideo: null as Video | null })),
                ),
            ),
        ).pipe(
            map((pairs) =>
                shuffle(
                    pairs
                        .map(({ seed, bestVideo }): VideoCardItem | null => {
                            if (!bestVideo?.id || !bestVideo.key) {
                                return null;
                            }
                            return {
                                ...seed,
                                videoId: bestVideo.id,
                                videoKey: bestVideo.key,
                                videoName: bestVideo.name ?? seed.mediaTitle,
                                videoType: bestVideo.type,
                                videoPublishedAt: bestVideo.published_at,
                                videoOfficial: !!bestVideo.official,
                            };
                        })
                        .filter(isDefined),
                ),
            ),
        );
    }

    private pickBestTrailer(videos: Video[]): Video | null {
        const candidates = videos.filter(
            (video) =>
                video.site === 'YouTube' &&
                !!video.key &&
                (video.type === 'Trailer' || video.type === 'Teaser'),
        );
        if (!candidates.length) {
            return null;
        }

        return (
            candidates.find((video) => video.type === 'Trailer' && video.official) ??
            candidates[0]
        );
    }

    private toMovieSeed(item: MovieListItem): TrailerSeed {
        return {
            mediaId: item.id ?? 0,
            mediaType: 'movie',
            mediaTitle: item.title ?? '',
            mediaYear: item.release_date?.slice(0, 4) ?? '',
            mediaPosterPath: item.poster_path ?? null,
        };
    }

    private toTvSeed(item: TvSeriesListItem): TrailerSeed {
        return {
            mediaId: item.id ?? 0,
            mediaType: 'tv',
            mediaTitle: item.name ?? '',
            mediaYear: item.first_air_date?.slice(0, 4) ?? '',
            mediaPosterPath: item.poster_path ?? null,
        };
    }
}
