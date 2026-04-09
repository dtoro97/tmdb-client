import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

export interface UserListConfirmDialogData {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel: string;
    readonly cancelLabel?: string;
}

export type UserListConfirmDialogResult = true | undefined;

@Component({
    selector: 'app-user-list-confirm-dialog',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './user-list-confirm-dialog.component.html',
    styleUrl: './user-list-confirm-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListConfirmDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA)
        public readonly data: UserListConfirmDialogData,
        private readonly dialogRef: MatDialogRef<
            UserListConfirmDialogComponent,
            UserListConfirmDialogResult
        >,
    ) {}

    confirm(): void {
        this.dialogRef.close(true);
    }
}
