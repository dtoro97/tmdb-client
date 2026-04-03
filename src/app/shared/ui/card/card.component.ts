import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardItem } from '../../models';
import { ImageComponent } from '../image/image.component';
import { RatingBadgeComponent } from '../rating-badge/rating-badge.component';

export type CardDateFormat = 'year' | 'dayMonth';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    imports: [DatePipe, RouterLink, ImageComponent, RatingBadgeComponent],
    styleUrl: './card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
    @Input() item?: CardItem;
    @Input() dateFormat: CardDateFormat = 'year';
    @Input() showRating = true;
}
