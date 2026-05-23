import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DatePipe, DecimalPipe } from '@angular/common';

import { MediaListItem } from '../../models';
import { ImageComponent } from '../image/image.component';
import { BadgeComponent } from '../badge/badge.component';
import { RatingComponent } from '../rating/rating.component';

@Component({
    selector: 'app-media-list-item',
    templateUrl: './media-list-item.component.html',
    styleUrl: './media-list-item.component.scss',
    imports: [
        RouterLink,
        DecimalPipe,
        DatePipe,
        ImageComponent,
        RatingComponent,
        BadgeComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListItemComponent {
    @Input({ required: true }) item!: MediaListItem;
    @Input({ required: true }) routerLink!: (string | number)[];
    @Input() index: number | null = null;
    @Input() genreNames: string[] = [];
    @Input() userRating: number | null = null;
}
