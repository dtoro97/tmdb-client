import { DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

import {
    MediaRatingDialogComponent,
    MediaRatingDialogResult,
} from '../media-rating-dialog/media-rating-dialog.component';
import { UserSessionStoreService } from '../../services/user-session-store.service';

@Component({
    selector: 'app-editable-rating-button',
    imports: [DecimalPipe],
    templateUrl: './editable-rating-button.component.html',
    styleUrl: './editable-rating-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableRatingButtonComponent {
    @Input({ required: true }) currentRating!: number | null;
    @Input({ required: true }) title!: string;
    @Input() ariaLabel: string | null = null;
    @Input() disabled = false;
    @Output() dialogResult = new EventEmitter<MediaRatingDialogResult>();

    constructor(
        private readonly dialog: MatDialog,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    open(): void {
        if (this.disabled) {
            return;
        }

        this.dialog
            .open(MediaRatingDialogComponent, {
                data: {
                    title: this.title,
                    currentRating: this.currentRating,
                    authMode: this.userSessionStore.mode(),
                },
                maxWidth: '36rem',
                width: '100%',
            })
            .afterClosed()
            .pipe(take(1))
            .subscribe((result: MediaRatingDialogResult | undefined) => {
                if (result !== undefined) {
                    this.dialogResult.emit(result);
                }
            });
    }
}
