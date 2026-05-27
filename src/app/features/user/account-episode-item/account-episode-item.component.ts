import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    EpisodeListItemData,
    ImageComponent,
    RatingComponent,
    SkeletonComponent,
} from '../../../shared';

@Component({
    selector: 'app-account-episode-item',
    imports: [DatePipe, ImageComponent, RatingComponent, RouterLink, SkeletonComponent],
    templateUrl: './account-episode-item.component.html',
    styleUrl: './account-episode-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountEpisodeItemComponent {
    @Input() item: EpisodeListItemData | null = null;
    @Input() loading = false;
}
