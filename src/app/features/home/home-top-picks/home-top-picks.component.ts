import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    BadgeComponent,
    CardComponent,
    CardItem,
    ImageComponent,
    LoadableItems,
    RatingBadgeComponent,
    SkeletonComponent,
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
        RatingBadgeComponent,
        SkeletonComponent,
    ],
    templateUrl: './home-top-picks.component.html',
    styleUrl: './home-top-picks.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTopPicksComponent implements OnChanges {
    @Input({ required: true }) state!: LoadableItems<CardItem>;
    @Input() maxItems = 10;

    readonly featuredCount = 3;

    featuredItems: RankedTopPickItem[] = [];
    secondaryItems: RankedTopPickItem[] = [];
    featuredSkeletonItems: number[] = [];
    secondarySkeletonItems: number[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['state'] || changes['maxItems']) {
            this.syncSkeletons();
            this.syncItems();
        }
    }

    private syncSkeletons(): void {
        const featuredLength = Math.min(this.featuredCount, this.maxItems);
        const secondaryLength = Math.max(this.maxItems - featuredLength, 0);

        this.featuredSkeletonItems = Array.from(
            { length: featuredLength },
            (_, index) => index,
        );
        this.secondarySkeletonItems = Array.from(
            { length: secondaryLength },
            (_, index) => index,
        );
    }

    private syncItems(): void {
        if (
            this.state.type !== 'loaded' &&
            this.state.type !== 'loading-more'
        ) {
            this.featuredItems = [];
            this.secondaryItems = [];
            return;
        }

        const rankedItems = this.state.value
            .slice(0, this.maxItems)
            .map((item, index) => ({
                item,
                rank: index + 1,
            }));

        this.featuredItems = rankedItems.slice(0, this.featuredCount);
        this.secondaryItems = rankedItems.slice(this.featuredCount);
    }
}
