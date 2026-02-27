import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    Inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { BehaviorSubject, map } from 'rxjs';

import { Image } from '../../../api';
import { ImagePipe } from '../../pipes/image.pipe';
import { RatingComponent } from '../rating/rating.component';

export interface ViewerImage extends Image {
    caption?: string;
}

export interface PhotoViewerData {
    images: ViewerImage[];
    activeIndex: number;
}

@Component({
    selector: 'app-photo-viewer',
    imports: [
        AsyncPipe,
        MatButtonModule,
        MatIconModule,
        ImagePipe,
        RatingComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './photo-viewer.component.html',
    styleUrl: './photo-viewer.component.scss',
})
export class PhotoViewerComponent {
    private readonly index = new BehaviorSubject<number>(this.data.activeIndex);

    readonly activeImage$ = this.index.pipe(map((i) => this.data.images[i]));
    readonly counter$ = this.index.pipe(
        map((i) => `${i + 1} / ${this.data.images.length}`),
    );
    readonly hasPrev$ = this.index.pipe(map((i) => i > 0));
    readonly hasNext$ = this.index.pipe(
        map((i) => i < this.data.images.length - 1),
    );

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: PhotoViewerData,
        private dialogRef: MatDialogRef<PhotoViewerComponent>,
    ) {}

    prev(): void {
        if (this.index.value > 0) {
            this.index.next(this.index.value - 1);
        }
    }

    next(): void {
        if (this.index.value < this.data.images.length - 1) {
            this.index.next(this.index.value + 1);
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') this.prev();
        if (event.key === 'ArrowRight') this.next();
    }
}
