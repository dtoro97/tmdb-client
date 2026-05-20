import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-rating',
    imports: [MatIconModule, DecimalPipe],
    templateUrl: './rating.component.html',
    styleUrl: './rating.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingComponent {
    @Input({ required: true }) value: number;
}
