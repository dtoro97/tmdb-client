import { DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-user-rating',
    imports: [DecimalPipe, SkeletonComponent],
    templateUrl: './user-rating.component.html',
    styleUrl: './user-rating.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRatingComponent {
    @Input() currentRating: number | null = null;
    @Input() disabled = false;
    @Input() loading = false;
    @Input() pending = false;

    @Output() readonly ratingClick = new EventEmitter<void>();

    onClick(): void {
        this.ratingClick.emit();
    }
}
