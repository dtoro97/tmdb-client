import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

import { MediaUserListSummary } from '../../../shared';

export type MediaListDialogMode = 'lists' | 'sign-in';

export interface MediaListDialogData {
    title: string;
    mode: MediaListDialogMode;
    customLists: MediaUserListSummary[];
}

export type MediaListDialogResult = 'login' | { listId: number };

@Component({
    selector: 'app-media-list-dialog',
    imports: [MatButtonModule, MatDialogModule],
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

    selectList(listId: number) {
        this.dialogRef.close({ listId });
    }

    requestLogin() {
        this.dialogRef.close('login');
    }

    cancel() {
        this.dialogRef.close(undefined);
    }
}
