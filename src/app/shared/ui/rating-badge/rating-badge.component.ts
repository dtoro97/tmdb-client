import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-rating-badge',
    imports: [DecimalPipe],
    templateUrl: './rating-badge.component.html',
    styleUrl: './rating-badge.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingBadgeComponent {
    @Input({ required: true }) value!: number;
}
