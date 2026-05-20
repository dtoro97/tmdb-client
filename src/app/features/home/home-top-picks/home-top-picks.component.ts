import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    BadgeComponent,
    CardComponent,
    CardItem,
    ImageComponent,
    SkeletonComponent,
    RepeatPipe,
    RatingComponent,
} from '../../../shared';

interface RankedTopPickItem {
    readonly item: CardItem;
    readonly rank: number;
}

@Component({
    selector: 'app-home-top-picks',
    imports: [
        RouterLink,
        DatePipe,
        BadgeComponent,
        CardComponent,
        ImageComponent,
        SkeletonComponent,
        RepeatPipe,
        RatingComponent,
    ],
    templateUrl: './home-top-picks.component.html',
    styleUrl: './home-top-picks.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTopPicksComponent {
    @Input({ required: true }) loading!: boolean;
    @Input({ required: true }) featuredItems!: readonly RankedTopPickItem[];
    @Input({ required: true }) secondaryItems!: readonly RankedTopPickItem[];

    readonly featuredSkeletonCount = 3;
    readonly secondarySkeletonCount = 7;
}
