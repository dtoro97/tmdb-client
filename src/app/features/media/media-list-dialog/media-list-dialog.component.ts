import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

import { ImageComponent, MediaUserListSummary } from '../../../shared';

export interface MediaListDialogData {
    title: string;
    customLists: MediaUserListSummary[];
}

export type MediaListDialogResult =
    | { kind: 'select-list'; listId: number }
    | { kind: 'create-list'; mediaTitle: string };

@Component({
    selector: 'app-media-list-dialog',
    imports: [ImageComponent, MatButtonModule, MatDialogModule],
    templateUrl: './media-list-dialog.component.html',
    styleUrl: './media-list-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA)
        public readonly data: MediaListDialogData,
        private readonly dialogRef: MatDialogRef<
            MediaListDialogComponent,
            MediaListDialogResult
        >,
    ) {}

    selectList(listId: number): void {
        this.dialogRef.close({ kind: 'select-list', listId });
    }

    createList(): void {
        this.dialogRef.close({ kind: 'create-list', mediaTitle: this.data.title });
    }

    cancel(): void {
        this.dialogRef.close(undefined);
    }
}
