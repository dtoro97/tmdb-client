import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { switchMap, tap } from 'rxjs';

import {
    PhotoViewerComponent,
    PhotosBrowserComponent,
    PhotosBrowserSelection,
    SubPageBannerComponent,
} from '../../../shared';
import { PersonDetailStoreService } from '../person-detail-store.service';

@Component({
    selector: 'app-person-photos-page',
    imports: [AsyncPipe, PhotosBrowserComponent, SubPageBannerComponent],
    providers: [PersonDetailStoreService],
    templateUrl: './person-photos-page.component.html',
    styleUrl: './person-photos-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonPhotosPageComponent {
    constructor(
        public personDetailStore: PersonDetailStoreService,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private title: Title,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((paramMap) =>
                    this.personDetailStore.getPersonDetails$(
                        Number(paramMap.get('personId')),
                    ),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.personDetailStore.person$
            .pipe(
                tap((person) => this.title.setTitle(`${person.name} | Photos`)),
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
