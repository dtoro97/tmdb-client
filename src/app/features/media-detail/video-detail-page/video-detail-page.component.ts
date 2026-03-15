import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    catchError,
    combineLatest,
    forkJoin,
    map,
    of,
    startWith,
    switchMap,
    tap,
} from 'rxjs';

import {
    MovieRestControllerService,
    TvSeriesRestControllerService,
    Video,
} from '../../../api';
import {
    CarouselComponent,
    ConfigStoreService,
    SubPageBannerComponent,
    YoutubeVideoComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';

interface SimilarMediaTrailer {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    mediaTitle: string;
    mediaYear: string;
    video: Video;
}

@Component({
    selector: 'app-video-detail-page',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatChipsModule,
        SubPageBannerComponent,
        YoutubeVideoComponent,
        CarouselComponent,
    ],
    templateUrl: './video-detail-page.component.html',
    styleUrl: './video-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDetailPageComponent {
    readonly vm$ = this.mediaStoreService.viewModel$;

    readonly selectedVideo$ = combineLatest([
        this.mediaStoreService.allVideos$,
        this.route.paramMap.pipe(map((params) => params.get('videoId') ?? '')),
    ]).pipe(
        map(
            ([videos, videoId]) =>
                videos.find((video) => video.id === videoId) ?? null,
        ),
    );

    readonly selectedVideoMeta$ = combineLatest([
        this.selectedVideo$,
        this.configStoreService.languages$.pipe(startWith([])),
    ]).pipe(
        map(([video, languages]) => ({
            video,
            languageName:
                video?.iso_639_1 &&
                Array.isArray(languages) &&
                languages.length
                    ? (languages.find(
                          (lang) => lang.iso_639_1 === video.iso_639_1,
                      )?.english_name ?? video.iso_639_1)
                    : (video?.iso_639_1 ?? ''),
        })),
    );

    readonly relatedVideos$ = combineLatest([
        this.mediaStoreService.allVideos$,
        this.route.paramMap.pipe(map((params) => params.get('videoId') ?? '')),
    ]).pipe(
        map(([videos, selectedVideoId]) =>
            videos
                .filter(
                    (video) =>
                        !!video.id &&
                        !!video.key &&
                        video.id !== selectedVideoId,
                )
                .slice(0, 12),
        ),
    );

    readonly similarMediaTrailers$ = combineLatest([
        this.mediaStoreService.recommendations$,
        this.mediaStoreService.viewModel$,
    ]).pipe(
        switchMap(([similar, vm]) => {
            const seeds = similar
                .slice(0, 14)
                .map((item) =>
                    this.toSimilarSeed(
                        item as Record<string, unknown>,
                        vm.mediaType,
                    ),
                )
                .filter(
                    (
                        seed,
                    ): seed is {
                        mediaId: number;
                        mediaType: 'movie' | 'tv';
                        mediaTitle: string;
                        mediaYear: string;
                    } => !!seed,
                );

            if (!seeds.length) {
                return of([] as SimilarMediaTrailer[]);
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
                            bestVideo: this.pickBestTrailer(
                                response.results ?? [],
                            ),
                        })),
                        catchError(() =>
                            of({ seed, bestVideo: null as Video | null }),
                        ),
                    ),
                ),
            ).pipe(
                map((rows) =>
                    rows
                        .map(({ seed, bestVideo }): SimilarMediaTrailer | null => {
                            if (!bestVideo?.id || !bestVideo.key) {
                                return null;
                            }
                            return {
                                mediaId: seed.mediaId,
                                mediaType: seed.mediaType,
                                mediaTitle: seed.mediaTitle,
                                mediaYear: seed.mediaYear,
                                video: bestVideo,
                            };
                        })
                        .filter(
                            (item): item is SimilarMediaTrailer => !!item,
                        )
                        .slice(0, 10),
                ),
            );
        }),
    );

    private readonly opts = { httpHeaderAccept: 'application/json' as const };

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private configStoreService: ConfigStoreService,
        private movieService: MovieRestControllerService,
        private tvService: TvSeriesRestControllerService,
        private route: ActivatedRoute,
        private title: Title,
    ) {
        combineLatest([this.mediaStoreService.title$, this.selectedVideo$])
            .pipe(
                takeUntilDestroyed(),
                tap(([mediaTitle, video]) => {
                    const pageTitle = video?.name
                        ? `${video.name} | ${mediaTitle}`
                        : mediaTitle;
                    this.title.setTitle(pageTitle);
                }),
            )
            .subscribe();
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
            candidates.find(
                (video) => video.type === 'Trailer' && video.official,
            ) ?? candidates[0]
        );
    }

    private toSimilarSeed(
        item: Record<string, unknown>,
        mediaType: 'movie' | 'tv',
    ):
        | {
              mediaId: number;
              mediaType: 'movie' | 'tv';
              mediaTitle: string;
              mediaYear: string;
          }
        | null {
        const mediaId = Number(item['id'] ?? 0);
        if (!mediaId) {
            return null;
        }

        const title =
            mediaType === 'movie'
                ? String(item['title'] ?? '')
                : String(item['name'] ?? '');
        const rawDate =
            mediaType === 'movie'
                ? String(item['release_date'] ?? '')
                : String(item['first_air_date'] ?? '');

        return {
            mediaId,
            mediaType,
            mediaTitle: title,
            mediaYear: rawDate ? rawDate.slice(0, 4) : '',
        };
    }
}
