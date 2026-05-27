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

        const topRatedEpisode = getTopRatedEpisode(this.state.value);

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
                badges:
                    episode === topRatedEpisode
                        ? [{ label: 'Top rated', variant: 'accent' as const }]
                        : undefined,
                routeCommands: [
                    ...this.routePrefix,
                    episode.season_number as number,
                    episode.episode_number as number,
                ],
            },
        }));
    }
}

function getTopRatedEpisode(episodes: readonly TvEpisode[]): TvEpisode | null {
    const ratedEpisodes = episodes.filter((episode) => (episode.vote_average ?? 0) > 0);

    if (!ratedEpisodes.length) {
        return null;
    }

    return ratedEpisodes.reduce((best, episode) => {
        const currentRating = episode.vote_average ?? 0;
        const bestRating = best.vote_average ?? 0;

        if (currentRating !== bestRating) {
            return currentRating > bestRating ? episode : best;
        }

        return (episode.vote_count ?? 0) > (best.vote_count ?? 0) ? episode : best;
    });
}
