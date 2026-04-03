import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';

import { SMALL_LIST_COUNT } from '../../../constants';
import { TvEpisode } from '../../../api';
import {
    EpisodeListItemComponent,
    EpisodeListItemData,
    LoadableItems,
    RepeatPipe,
} from '../../../shared';

interface EpisodeListItem {
    readonly id: string;
    readonly item: EpisodeListItemData;
}

@Component({
    selector: 'app-episode-list',
    imports: [EpisodeListItemComponent, RepeatPipe],
    templateUrl: './episode-list.component.html',
    styleUrl: './episode-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeListComponent implements OnChanges {
    @Input({ required: true }) state!: LoadableItems<TvEpisode>;
    @Input() skeletonCount = SMALL_LIST_COUNT;
    @Input() routePrefix: Array<string | number> = [];
    episodeItems: ReadonlyArray<EpisodeListItem> = [];

    ngOnChanges(): void {
        if (this.state.type !== 'loaded') {
            this.episodeItems = [];
            return;
        }

        this.episodeItems = this.state.value.map((episode) => ({
            id: `${episode.season_number ?? 'season'}-${episode.episode_number ?? 'episode'}-${episode.id ?? episode.name ?? 'unknown'}`,
            item: {
                name: episode.name ?? 'Untitled episode',
                subtitle: null,
                overview: episode.overview ?? '',
                stillPath: episode.still_path ?? null,
                seasonNumber: episode.season_number ?? null,
                episodeNumber: episode.episode_number ?? null,
                airDate: episode.air_date ?? null,
                runtime: episode.runtime ?? null,
                voteAverage: episode.vote_average ?? null,
                routeCommands: [
                    ...this.routePrefix,
                    episode.season_number as number,
                    episode.episode_number as number,
                ],
            },
        }));
    }
}
