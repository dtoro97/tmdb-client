import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { tap } from 'rxjs';

import {
    PhotoViewerComponent,
    PhotosBrowserComponent,
    PhotosBrowserSelection,
    SubPageHeaderComponent,
    PhotosBrowserSkeletonComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';

@Component({
    selector: 'app-media-photos-page',
    imports: [
        AsyncPipe,
        PhotosBrowserComponent,
        SubPageHeaderComponent,
        PhotosBrowserSkeletonComponent,
    ],
    templateUrl: './media-photos-page.component.html',
    styleUrl: './media-photos-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPhotosPageComponent {
    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private dialog: MatDialog,
        private title: Title,
    ) {
        this.mediaStoreService.title$
            .pipe(
                tap((mediaTitle) =>
                    this.title.setTitle(`${mediaTitle} | Photos`),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    openPhotoViewer(selection: PhotosBrowserSelection): void {
        this.dialog.open(PhotoViewerComponent, {
            data: { images: selection.images, activeIndex: selection.index },
            panelClass: 'photo-viewer-panel',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            autoFocus: false,
        });
    }
}
