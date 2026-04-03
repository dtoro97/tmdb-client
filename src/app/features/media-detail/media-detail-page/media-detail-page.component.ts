import { AsyncPipe, DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { filter, take, tap } from 'rxjs';

import {
    HeroSurfaceComponent,
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RatingComponent,
    RepeatPipe,
    SkeletonComponent,
    ExternalLinksComponent,
    VoteCountPipe,
    VideosGridComponent,
    MediaCarouselPanelComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { Title } from '@angular/platform-browser';
import { MAX_VISIBLE_PHOTOS } from '../../../constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaCreditsPanelComponent } from '../media-credits-panel/media-credits-panel.component';
import { MediaDetailVm } from '../media-detail.models';
import { buildYoutubeWatchUrl } from '../../../shared';
import { KeywordsListComponent } from '../keywords-list/keywords-list.component';
import { EpisodeListItemComponent } from '../episode-list-item/episode-list-item.component';
import { RatingDistributionComponent } from '../rating-distribution/rating-distribution.component';
import { ReviewCardComponent } from '../review-card/review-card.component';

type HeroAnimationState = 'enter' | 'fade' | false;

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
        RatingComponent,
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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-detail-page.component.html',
    styleUrl: './media-detail-page.component.scss',
})
export class MediaDetailsComponent {
    private readonly maxVisiblePhotos = MAX_VISIBLE_PHOTOS;
    heroAnimationActive: HeroAnimationState = 'enter';
    private hasLoadedOnce = false;
    readonly recommendationsSkeletonCount = 4;

    readonly vm$ = this.mediaStoreService.mediaDetailVm$;

    constructor(
        private mediaStoreService: MediaDetailStoreService,
        public mediaVideoStoreService: MediaVideoStoreService,
        private dialog: MatDialog,
        private title: Title,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        @Inject(DOCUMENT) private document: Document,
    ) {
        this.vm$
            .pipe(
                takeUntilDestroyed(),
                tap((media) => {
                    if (!media && this.hasLoadedOnce) {
                        this.heroAnimationActive = false;
                        this.cdr.markForCheck();
                    }
                }),
                filter((media): media is MediaDetailVm => !!media),
                tap((mediaDetail) => {
                    if (!this.hasLoadedOnce) {
                        this.hasLoadedOnce = true;
                    } else {
                        this.heroAnimationActive = 'fade';
                        this.cdr.markForCheck();
                    }
                    const typeLabel =
                        mediaDetail.media.mediaType === 'tv'
                            ? 'TV Show'
                            : 'Movie';
                    this.title.setTitle(
                        `${mediaDetail.media.title} | ${typeLabel}`,
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
