import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import {
    EpisodeListItemComponent,
    EpisodeListItemData,
    LoadableItems,
    RatingComponent,
} from '../../../shared';
import { RepeatPipe } from '../../../shared/pipes/repeat.pipe';
import { UserRatedEpisodeItem } from '../user-data.models';

interface DisplayRatedEpisodeItem {
    readonly item: UserRatedEpisodeItem;
    readonly episodeItem: EpisodeListItemData;
}

@Component({
    selector: 'app-episode-rating-list',
    imports: [
        DecimalPipe,
        EpisodeListItemComponent,
        RatingComponent,
        RepeatPipe,
    ],
    templateUrl: './episode-rating-list.component.html',
    styleUrl: './episode-rating-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeRatingListComponent implements OnChanges {
    @Input({ required: true }) state!: LoadableItems<UserRatedEpisodeItem>;
    @Input() skeletonCount = 10;

    displayItems: DisplayRatedEpisodeItem[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['state']) {
            this.displayItems = this.toDisplayItems(this.state);
        }
    }

    private toDisplayItems(
        state: LoadableItems<UserRatedEpisodeItem>,
    ): DisplayRatedEpisodeItem[] {
        if (state.type !== 'loaded' && state.type !== 'loading-more') {
            return [];
        }

        return state.value.map((item) => ({
            item,
            episodeItem: {
                name: item.name,
                subtitle: item.showName,
                overview: item.overview.trim() || 'No overview available.',
                stillPath: item.stillPath,
                seasonNumber: item.seasonNumber,
                episodeNumber: item.episodeNumber,
                airDate: item.airDate || null,
                runtime: item.runtime,
                voteAverage: null,
                routeCommands: this.toEpisodeRoute(item),
            },
        }));
    }

    private toEpisodeRoute(
        item: UserRatedEpisodeItem,
    ): readonly (string | number)[] | null {
        if (
            item.showId === null ||
            item.seasonNumber === null ||
            item.episodeNumber === null
        ) {
            return null;
        }

        return [
            '/title',
            item.showId,
            'tv',
            'episodes',
            item.seasonNumber,
            item.episodeNumber,
        ];
    }
}
