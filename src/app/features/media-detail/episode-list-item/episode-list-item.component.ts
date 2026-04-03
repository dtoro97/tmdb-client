import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TvEpisode } from '../../../api';
import {
    ImageComponent,
    RatingComponent,
    SkeletonComponent,
} from '../../../shared';

@Component({
    selector: 'app-episode-list-item',
    imports: [
        RouterLink,
        DatePipe,
        ImageComponent,
        RatingComponent,
        SkeletonComponent,
    ],
    templateUrl: './episode-list-item.component.html',
    styleUrl: './episode-list-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeListItemComponent {
    @Input() episode: TvEpisode | null = null;
    @Input() routerLink: (string | number)[] = [];
    @Input() loading = false;
}
