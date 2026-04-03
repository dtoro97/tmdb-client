import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardItem } from '../../models';
import { ImageComponent } from '../image/image.component';
import { RatingComponent } from '../rating/rating.component';

export type BackdropCardDateFormat = 'year' | 'dayMonth';

@Component({
    selector: 'app-backdrop-card',
    templateUrl: './backdrop-card.component.html',
    imports: [
        DatePipe,
        DecimalPipe,
        RouterLink,
        ImageComponent,
        RatingComponent,
    ],
    styleUrl: './backdrop-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackdropCardComponent {
    @Input({ required: true }) item!: CardItem;
    @Input() showDate = false;
    @Input() showRating = true;
    @Input() dateFormat: BackdropCardDateFormat = 'year';
}
