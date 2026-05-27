import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MediaListItemBadge } from '../../models';
import { BadgeComponent } from '../badge/badge.component';
import { ImageComponent } from '../image/image.component';
import { RatingComponent } from '../rating/rating.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export interface EpisodeListItemData {
    readonly name: string;
    readonly subtitle: string | null;
    readonly overview: string;
    readonly stillPath: string | null;
    readonly seasonNumber: number | null;
    readonly episodeNumber: number | null;
    readonly airDate: string | null;
    readonly runtime: number | null;
    readonly voteAverage: number | null;
    readonly badges?: readonly MediaListItemBadge[];
    readonly routeCommands: readonly (string | number)[] | null;
}

@Component({
    selector: 'app-episode-list-item',
    imports: [
        BadgeComponent,
        DatePipe,
        ImageComponent,
        RatingComponent,
        RouterLink,
        SkeletonComponent,
    ],
    templateUrl: './episode-list-item.component.html',
    styleUrl: './episode-list-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeListItemComponent {
    @Input() item: EpisodeListItemData | null = null;
    @Input() loading = false;
}
