import {
    ChangeDetectionStrategy,
    computed,
    Component,
    HostListener,
    Inject,
    signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import type { PhotoViewerData } from '../../models';
import { ImagePipe } from '../../pipes/image.pipe';
import { OverlayIconButtonComponent } from '../overlay-icon-button/overlay-icon-button.component';
import { RatingComponent } from '../rating/rating.component';

function clampIndex(index: number, length: number): number {
    if (length <= 0) {
        return 0;
    }

    const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;

    return Math.min(Math.max(normalizedIndex, 0), length - 1);
}

@Component({
    selector: 'app-photo-viewer',
    imports: [MatIconModule, ImagePipe, OverlayIconButtonComponent, RatingComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './photo-viewer.component.html',
    styleUrl: './photo-viewer.component.scss',
})
export class PhotoViewerComponent {
    private readonly images = this.data.images;
    private readonly index = signal(
        clampIndex(this.data.activeIndex, this.images.length),
    );

    readonly activeImage = computed(() => this.images[this.index()] ?? null);
    readonly counter = computed(() =>
        this.images.length ? `${this.index() + 1} / ${this.images.length}` : '',
    );
    readonly hasPrev = computed(() => this.index() > 0);
    readonly hasNext = computed(() => this.index() < this.images.length - 1);

    constructor(
        @Inject(MAT_DIALOG_DATA) public readonly data: PhotoViewerData,
        private dialogRef: MatDialogRef<PhotoViewerComponent>,
        private router: Router,
    ) {
        if (this.images.length === 0) {
            this.dialogRef.close();
        }
    }

    prev(): void {
        if (this.hasPrev()) {
            this.index.update((index) => index - 1);
        }
    }

    next(): void {
        if (this.hasNext()) {
            this.index.update((index) => index + 1);
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    openPhotosPage(): void {
        const { photosLink } = this.data;

        if (!photosLink) {
            return;
        }

        this.dialogRef.close();

        if (typeof photosLink !== 'string') {
            this.router.navigate(photosLink);
            return;
        }

        this.router.navigateByUrl(photosLink);
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.prev();
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.next();
        }
    }
}
