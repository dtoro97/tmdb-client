import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    CardComponent,
    CardItem,
    ImageComponent,
    SkeletonComponent,
    RepeatPipe,
    RatingComponent,
} from '../../../shared';

interface TopPickItem {
    readonly item: CardItem;
}

@Component({
    selector: 'app-home-top-picks',
    imports: [
        RouterLink,
        DatePipe,
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
    @Input({ required: true }) featuredItems!: readonly TopPickItem[];
    @Input({ required: true }) secondaryItems!: readonly TopPickItem[];

    readonly featuredSkeletonCount = 3;
    readonly secondarySkeletonCount = 7;
}
