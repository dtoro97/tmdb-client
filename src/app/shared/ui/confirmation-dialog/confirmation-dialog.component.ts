import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

export type ConfirmationDialogTone = 'default' | 'danger';

export interface ConfirmationDialogData {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel: string;
    readonly cancelLabel?: string;
    readonly tone?: ConfirmationDialogTone;
}

export type ConfirmationDialogResult = true | undefined;

@Component({
    selector: 'app-confirmation-dialog',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './confirmation-dialog.component.html',
    styleUrl: './confirmation-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel: string;
    readonly cancelLabel: string;
    readonly isDanger: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        data: ConfirmationDialogData,
        private readonly dialogRef: MatDialogRef<
            ConfirmationDialogComponent,
            ConfirmationDialogResult
        >,
    ) {
        this.title = data.title;
        this.message = data.message;
        this.confirmLabel = data.confirmLabel;
        this.cancelLabel = data.cancelLabel ?? 'Cancel';
        this.isDanger = data.tone === 'danger';
    }

    confirm(): void {
        this.dialogRef.close(true);
    }
}
