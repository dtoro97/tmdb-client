import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { take, tap } from 'rxjs';

import { Image } from '../../../api';
import {
    CardComponent,
    CarouselComponent,
    MediaThumbComponent,
    PersonCardComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RatingComponent,
    SocialLinksComponent,
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
        CardComponent,
        PersonCardComponent,
        MediaThumbComponent,
        PhotosGridComponent,
        RatingComponent,
        SocialLinksComponent,
        MinutesToHours,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-details.component.html',
    styleUrl: './media-details.component.scss',
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
    ) {}

    openPhotoViewer(index: number): void {
        this.mediaStoreService.allBackdrops$
            .pipe(take(1))
            .subscribe((images: Image[]) => {
                this.dialog.open(PhotoViewerComponent, {
                    data: { images, activeIndex: index },
                    panelClass: 'photo-viewer-panel',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    width: '100vw',
                    height: '100vh',
                    autoFocus: false,
                });
            });
    }

    getYoutubeThumbnail(key: string): string {
        return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
    }

    getYoutubeUrl(key: string): string {
        return `https://www.youtube.com/watch?v=${key}`;
    }
}
