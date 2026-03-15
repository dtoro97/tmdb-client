import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaThumbComponent } from '../media-thumb/media-thumb.component';
import { RatingComponent } from '../rating/rating.component';

export interface MediaListItem {
    id: number;
    thumb: string | null;
    title: string;
    overview: string;
    rating: number | null;
    date: string;
    mediaType: string;
    voteCount: number;
}

@Component({
    selector: 'app-media-list-item',
    templateUrl: './media-list-item.component.html',
    styleUrl: './media-list-item.component.scss',
    imports: [RouterLink, MediaThumbComponent, RatingComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListItemComponent {
    @Input({ required: true }) item!: MediaListItem;
    @Input({ required: true }) routerLink!: (string | number)[];
    @Input() index: number | null = null;
}
