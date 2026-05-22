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
    YoutubeVideoCardComponent,
    YoutubeVideoComponent,
    RepeatPipe,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';

@Component({
    selector: 'app-video-detail-page',
    imports: [
        AsyncPipe,
        BadgeComponent,
        DatePipe,
        RouterLink,
        YoutubeVideoCardComponent,
        YoutubeVideoComponent,
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
        map(({ mediaState, selected, videosState, relatedVideos }) => ({
            media: mediaState.type === 'loaded' ? mediaState.value : null,
            selected,
            videosState,
            relatedVideos,
            isLoading:
                videosState.type === 'loading' || videosState.type === 'idle',
        })),
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
}

