import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

import { SMALL_LIST_COUNT } from '../../../constants';
import { LoadableItems } from '../../types';
import { MediaListItem } from '../../models';
import { RepeatPipe } from '../../pipes/repeat.pipe';
import { MediaListItemComponent } from '../media-list-item/media-list-item.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type MediaListRouteType = 'item' | 'movie' | 'tv';

interface DisplayMediaListItem {
    readonly item: MediaListItem;
    readonly genreNames: string[];
    readonly userRating: number | null;
}

@Component({
    selector: 'app-media-list',
    imports: [
        NgTemplateOutlet,
        MediaListItemComponent,
        SkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './media-list.component.html',
    styleUrl: './media-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListComponent implements OnChanges {
    @Input({ required: true }) state!: LoadableItems<MediaListItem>;
    @Input() skeletonCount = SMALL_LIST_COUNT;
    @Input() showIndex = false;
    @Input() indexStart = 1;
    @Input() descendingFrom: number | null = null;
    @Input() routeType: MediaListRouteType = 'item';
    @Input() genreMap: Map<number, string> = new Map();
    @Input() userRatings: ReadonlyMap<number, number> = new Map();

    displayItems: DisplayMediaListItem[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['state'] || changes['genreMap'] || changes['userRatings']) {
            this.displayItems = this.toDisplayItems(
                this.state,
                this.genreMap,
                this.userRatings,
            );
        }
    }

    private toDisplayItems(
        state: LoadableItems<MediaListItem>,
        genreMap: Map<number, string>,
        userRatings: ReadonlyMap<number, number>,
    ): DisplayMediaListItem[] {
        if (state.type !== 'loaded' && state.type !== 'loading-more') {
            return [];
        }

        return state.value.map((item) => ({
            item,
            genreNames: (item.genreIds ?? [])
                .map((genreId) => genreMap.get(genreId))
                .filter((genreName): genreName is string => !!genreName)
                .slice(0, 3),
            userRating: userRatings.get(item.id) ?? null,
        }));
    }
}
