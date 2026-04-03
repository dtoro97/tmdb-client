import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';

import { SMALL_LIST_COUNT } from '../../../constants';
import { TvEpisode } from '../../../api';
import { EpisodeListItemComponent } from '../episode-list-item/episode-list-item.component';
import { LoadableItems, RepeatPipe } from '../../../shared';

interface EpisodeListItem {
    readonly episode: TvEpisode;
    readonly routerLink: Array<string | number>;
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
            episode,
            routerLink: [
                ...this.routePrefix,
                episode.season_number as number,
                episode.episode_number as number,
            ],
        }));
    }
}
