import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

export interface CardItem {
    id?: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    profile_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    media_type?: string;
}

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    imports: [DatePipe, DecimalPipe, RouterLink, MediaThumbComponent],
    styleUrl: './card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
    @Input() public item: CardItem;
    @Input() public type: string;
    @Input() public role?: string;
}
