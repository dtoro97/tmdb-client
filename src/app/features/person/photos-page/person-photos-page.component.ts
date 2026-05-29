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
import { PersonDetailStoreService } from '../person-detail-store.service';

@Component({
    selector: 'app-person-photos-page',
    imports: [
        AsyncPipe,
        PhotosBrowserComponent,
        SubPageHeaderComponent,
        PhotosBrowserSkeletonComponent,
    ],
    templateUrl: './person-photos-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonPhotosPageComponent {
    constructor(
        public personDetailStore: PersonDetailStoreService,
        private dialog: MatDialog,
        private title: Title,
    ) {
        this.personDetailStore.personDetailVm$
            .pipe(
                tap((vm) => {
                    if (vm.person.state === 'success' && vm.person.data) {
                        this.title.setTitle(`${vm.person.data.name} | Photos`);
                    }
                }),
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

