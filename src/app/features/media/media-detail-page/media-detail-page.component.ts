import { AsyncPipe, DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { distinctUntilChanged, filter, map, take, tap } from 'rxjs';

import {
    EpisodeListItemComponent,
    HeroSurfaceComponent,
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosPreviewComponent,
    RepeatPipe,
    SkeletonComponent,
    ExternalLinksComponent,
    VoteCountPipe,
    VideosGridComponent,
    MediaCarouselPanelComponent,
    RatingDistributionComponent,
    RecentlyViewedStoreService,
    buildYoutubeWatchUrl,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaCreditsPanelComponent } from '../media-credits-panel/media-credits-panel.component';
import { UserRatingComponent } from '../../../shared';
import { KeywordsListComponent } from '../keywords-list/keywords-list.component';
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
        PhotosPreviewComponent,
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
    readonly vm$ = this.mediaStoreService.mediaDetailVm$;

    constructor(
        private mediaStoreService: MediaDetailStoreService,
        private mediaActionsStoreService: MediaDetailActionsStore,
        private dialog: MatDialog,
        private title: Title,
        private recentlyViewedStore: RecentlyViewedStoreService,
        private router: Router,
        private route: ActivatedRoute,
        @Inject(DOCUMENT) private document: Document,
    ) {
        this.vm$
            .pipe(
                takeUntilDestroyed(),
                map((vm) => vm.media),
                filter(Boolean),
                distinctUntilChanged(
                    (previous, current) => previous.id === current.id && previous.mediaType === current.mediaType,
                ),
                tap((mediaDetail) => {
                    const typeLabel = mediaDetail.mediaType === 'tv' ? 'TV Shows' : 'Movie';
                    this.title.setTitle(`${mediaDetail.title} | ${typeLabel}`);
                    this.recentlyViewedStore.addItem({
                        kind: 'media',
                        id: mediaDetail.id,
                        mediaType: mediaDetail.mediaType,
                        title: mediaDetail.title,
                        imagePath: mediaDetail.posterPath,
                        backdropPath: mediaDetail.backdropPath,
                        rating: mediaDetail.voteAverage,
                        date: mediaDetail.releaseDate ?? mediaDetail.firstAirDate ?? '',
                        overview: mediaDetail.overview,
                    });
                    this.mediaActionsStoreService.setMedia(mediaDetail.id, mediaDetail.mediaType);
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.vm$
            .pipe(
                filter((vm): vm is typeof vm & { media: NonNullable<typeof vm.media> } => !!vm.media),
                take(1),
            )
            .subscribe((vm) => {
                if (vm.photos.type !== 'loaded' || !vm.photos.value) {
                    return;
                }

                this.dialog.open(PhotoViewerComponent, {
                    data: {
                        images: vm.photos.value.allPhotos,
                        activeIndex: index,
                        photosLink: ['/title', vm.media.id, vm.media.mediaType, 'photos'],
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

    openPhotosPage(): void {
        this.router.navigate(['photos'], {
            relativeTo: this.route,
        });
    }

    openTrailer(key: string): void {
        this.document.defaultView?.open(buildYoutubeWatchUrl(key), '_blank', 'noopener,noreferrer');
    }
}
