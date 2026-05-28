import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    BadgeComponent,
    ImageComponent,
    MediaListItem,
    RatingComponent,
    SkeletonComponent,
} from '../../../shared';

@Component({
    selector: 'app-account-media-item',
    imports: [BadgeComponent, DatePipe, ImageComponent, RatingComponent, RouterLink, SkeletonComponent],
    templateUrl: './account-media-item.component.html',
    styleUrl: './account-media-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMediaItemComponent {
    @Input() item: MediaListItem | null = null;
    @Input() link: readonly (string | number)[] | null = null;
    @Input() loading = false;
}
