import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { combineLatest, take, tap } from 'rxjs';

import { Image } from '../../../api';
import {
    CardComponent,
    CarouselComponent,
    KeywordsListComponent,
    MediaThumbComponent,
    PersonCardComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RatingComponent,
    SocialLinksComponent,
    YoutubeVideoComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-media-details',
    imports: [
        AsyncPipe,
        DatePipe,
        DecimalPipe,
        RouterLink,
        MatChipsModule,
        MatDialogModule,
        CarouselComponent,
        KeywordsListComponent,
        CardComponent,
        PersonCardComponent,
        MediaThumbComponent,
        PhotosGridComponent,
        RatingComponent,
        SocialLinksComponent,
        YoutubeVideoComponent,
        MinutesToHours,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-detail-page.component.html',
    styleUrl: './media-detail-page.component.scss',
})
export class MediaDetailsComponent {
    readonly vm$ = this.mediaStoreService.viewModel$.pipe(
        tap((vm) => {
            const typeLabel = vm.mediaType === 'tv' ? 'TV Show' : 'Movie';
            this.title.setTitle(`${vm.title} | ${typeLabel}`);
        }),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private dialog: MatDialog,
        private title: Title,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    openPhotoViewer(index: number): void {
        combineLatest([
            this.mediaStoreService.featuredPhotos$,
            this.mediaStoreService.photosTotalCount$,
            this.mediaStoreService.allPhotos$,
            this.mediaStoreService.viewModel$,
        ])
            .pipe(take(1))
            .subscribe(([featuredPhotos, totalCount, allPhotos, vm]) => {
                const isShowMoreTile =
                    index === featuredPhotos.length - 1 &&
                    totalCount > featuredPhotos.length;
                if (isShowMoreTile) {
                    this.router.navigate(['photos'], {
                        relativeTo: this.route,
                    });
                    return;
                }

                this.dialog.open(PhotoViewerComponent, {
                    data: {
                        images: allPhotos,
                        activeIndex: index,
                        photosLink: ['/title', vm.id, vm.mediaType, 'photos'],
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
}
