import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    FavoriteToggleComponent,
    ImageComponent,
    type MediaListItem,
    RatingComponent,
    WatchlistToggleComponent,
} from '../../../shared';

@Component({
    selector: 'app-discover-card',
    imports: [
        DatePipe,
        FavoriteToggleComponent,
        ImageComponent,
        RatingComponent,
        RouterLink,
        WatchlistToggleComponent,
    ],
    templateUrl: './discover-card.component.html',
    styleUrl: './discover-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverCardComponent {
    @Input({ required: true }) item!: MediaListItem;
    @Input({ required: true }) link!: (string | number)[];
    @Input() genreNames: string[] = [];
}
