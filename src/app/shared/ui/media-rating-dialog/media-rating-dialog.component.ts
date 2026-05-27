import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';

import { UserSessionMode } from '../../models';
import { normalizeRatingValue } from '../../utils/rating';

export interface MediaRatingDialogData {
    title: string;
    currentRating: number | null;
    authMode: UserSessionMode;
}

export type MediaRatingDialogResult = number | 'remove' | 'login' | { guestValue: number };

@Component({
    selector: 'app-media-rating-dialog',
    imports: [DecimalPipe, FormsModule, MatButtonModule, MatDialogModule, MatSliderModule],
    templateUrl: './media-rating-dialog.component.html',
    styleUrl: './media-rating-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaRatingDialogComponent {
    readonly value = signal(this.data.currentRating ?? 7);

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public readonly data: MediaRatingDialogData,
        private readonly dialogRef: MatDialogRef<MediaRatingDialogComponent, MediaRatingDialogResult>,
    ) {}

    removeRating(): void {
        this.dialogRef.close('remove');
    }

    save(): void {
        this.dialogRef.close(normalizeRatingValue(this.value()));
    }

    cancel(): void {
        this.dialogRef.close(undefined);
    }

    loginToSave(): void {
        this.dialogRef.close('login');
    }

    saveAsGuest(): void {
        this.dialogRef.close({ guestValue: normalizeRatingValue(this.value()) });
    }

    updateValue(value: number): void {
        this.value.set(normalizeRatingValue(value));
    }
}
