import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { combineLatest, map, tap } from 'rxjs';

import {
    BadgeComponent,
    CarouselComponent,
    EmptyStateComponent,
    PageSectionComponent,
    SkeletonComponent,
    VideoCardComponent,
    VideoCardItem,
    MediaDetails,
    YoutubePlayerComponent,
    RepeatPipe,
    buildYoutubeThumbnailUrl,
} from '../../../shared';
import { Video } from '../../../api';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';

@Component({
    selector: 'app-video-detail-page',
    imports: [
        AsyncPipe,
        BadgeComponent,
        DatePipe,
        RouterLink,
        VideoCardComponent,
        YoutubePlayerComponent,
        CarouselComponent,
        EmptyStateComponent,
        PageSectionComponent,
        SkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './video-detail-page.component.html',
    styleUrl: './video-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDetailPageComponent {
    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        selected: this.mediaVideoStoreService.selectedVideoMeta$,
        videosState: this.mediaVideoStoreService.videosState$,
        relatedVideos: this.mediaVideoStoreService.relatedVideos$,
    }).pipe(
        map(({ mediaState, selected, videosState, relatedVideos }) => {
            const media = mediaState.type === 'loaded' ? mediaState.value : null;
            const relatedVideoItems = media
                ? relatedVideos.flatMap((video) => {
                      const item = this.toRelatedVideoCardItem(video, media);
                      return item ? [item] : [];
                  })
                : [];

            return {
                media,
                selected,
                videosState,
                relatedVideoItems,
                isLoading:
                    videosState.type === 'loading' ||
                    videosState.type === 'idle',
            };
        }),
    );

    constructor(
        private mediaStoreService: MediaDetailStoreService,
        private mediaVideoStoreService: MediaVideoStoreService,
        private route: ActivatedRoute,
        private title: Title,
    ) {
        this.route.paramMap
            .pipe(
                takeUntilDestroyed(),
                map((params) => params.get('videoId') ?? ''),
                tap((videoId) =>
                    this.mediaVideoStoreService.setSelectedVideoId(videoId),
                ),
            )
            .subscribe();

        combineLatest([
            this.mediaStoreService.title$,
            this.mediaVideoStoreService.selectedVideo$,
        ])
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

    private toRelatedVideoCardItem(
        video: Video,
        media: MediaDetails,
    ): VideoCardItem | null {
        if (!video.id || !video.key) {
            return null;
        }

        const title = video.name ?? media.title;

        return {
            id: video.id,
            title,
            thumbnailUrl: buildYoutubeThumbnailUrl(video.key),
            alt: title,
            openLabel: `Open video: ${title}`,
            typeLabel: video.type,
            routerLink: [
                '/title',
                media.id,
                media.mediaType,
                'videos',
                video.id,
            ],
        };
    }
}

