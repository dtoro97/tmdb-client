import { AsyncPipe, DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { combineLatest, filter, map, take, tap } from 'rxjs';

import {
    EpisodeListItemComponent,
    HeroSurfaceComponent,
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RepeatPipe,
    SkeletonComponent,
    ExternalLinksComponent,
    VoteCountPipe,
    VideosGridComponent,
    MediaCarouselPanelComponent,
    buildYoutubeWatchUrl,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaReviewsStoreService } from '../media-reviews-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { Title } from '@angular/platform-browser';
import { MAX_VISIBLE_PHOTOS } from '../../../constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaCreditsPanelComponent } from '../media-credits-panel/media-credits-panel.component';
import { MediaDetailVm } from '../media-detail.models';
import { UserRatingComponent } from '../../../shared';
import { KeywordsListComponent } from '../keywords-list/keywords-list.component';
import { RatingDistributionComponent } from '../rating-distribution/rating-distribution.component';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { MediaListActionsComponent } from '../media-list-actions/media-list-actions.component';
import { MediaDetailActionsStore } from '../media-detail-actions-store.service';

@Component({
    selector: 'app-media-details',
    imports: [
        AsyncPipe,
        DatePipe,
        DecimalPipe,
        RouterLink,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        KeywordsListComponent,
        HeroSurfaceComponent,
        ImageComponent,
        PhotosGridComponent,
        RatingDistributionComponent,
        ReviewCardComponent,
        SkeletonComponent,
        ExternalLinksComponent,
        VideosGridComponent,
        VoteCountPipe,
        MinutesToHours,
        PageSectionComponent,
        RepeatPipe,
        EpisodeListItemComponent,
        MediaCreditsPanelComponent,
        MediaCarouselPanelComponent,
        UserRatingComponent,
        MediaListActionsComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-detail-page.component.html',
    styleUrl: './media-detail-page.component.scss',
})
export class MediaDetailsComponent {
    private readonly maxVisiblePhotos = MAX_VISIBLE_PHOTOS;
    readonly recommendationsSkeletonCount = 4;

    readonly vm$ = this.mediaStoreService.mediaDetailVm$;
    readonly heroTrailerState$ = combineLatest({
        videosState: this.mediaVideoStoreService.videosState$,
        trailer: this.mediaVideoStoreService.trailer$,
    }).pipe(
        map(({ videosState, trailer }) => ({
            loading:
                videosState.type === 'loading' || videosState.type === 'idle',
            key: trailer?.key ?? null,
        })),
    );

    constructor(
        private mediaStoreService: MediaDetailStoreService,
        private mediaActionsStoreService: MediaDetailActionsStore,
        public mediaReviewsStoreService: MediaReviewsStoreService,
        public mediaVideoStoreService: MediaVideoStoreService,
        private dialog: MatDialog,
        private title: Title,
        private router: Router,
        private route: ActivatedRoute,
        @Inject(DOCUMENT) private document: Document,
    ) {
        this.vm$
            .pipe(
                takeUntilDestroyed(),
                filter((media): media is MediaDetailVm => !!media),
                tap((mediaDetail) => {
                    const typeLabel =
                        mediaDetail.media.mediaType === 'tv'
                            ? 'TV Show'
                            : 'Movie';
                    this.title.setTitle(
                        `${mediaDetail.media.title} | ${typeLabel}`,
                    );
                    this.mediaActionsStoreService.setMediaContext(
                        mediaDetail.media.id,
                        mediaDetail.media.mediaType,
                    );
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.vm$
            .pipe(
                filter((vm): vm is MediaDetailVm => !!vm),
                take(1),
            )
            .subscribe((vm) => {
                const visibleCount = Math.min(
                    vm.photos.totalCount,
                    this.maxVisiblePhotos,
                );
                const isShowMoreTile =
                    index === visibleCount - 1 &&
                    vm.photos.totalCount > this.maxVisiblePhotos;

                if (isShowMoreTile) {
                    this.router.navigate(['photos'], {
                        relativeTo: this.route,
                    });
                    return;
                }

                this.dialog.open(PhotoViewerComponent, {
                    data: {
                        images: vm.photos.allPhotos,
                        activeIndex: index,
                        photosLink: [
                            '/title',
                            vm.media.id,
                            vm.media.mediaType,
                            'photos',
                        ],
                    },
                    panelClass: 'photo-viewer-panel',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    width: '100vw',
                    height: '100vh',
                    autoFocus: false,
                });
            });
    }

    openTrailer(key: string): void {
        this.document.defaultView?.open(
            buildYoutubeWatchUrl(key),
            '_blank',
            'noopener,noreferrer',
        );
    }
}
