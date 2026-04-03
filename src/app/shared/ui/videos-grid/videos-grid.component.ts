import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';

import { Video } from '../../../api';
import { GRID_COUNT, VIDEOS_GRID_FEATURED_COUNT } from '../../../constants';
import type { LoadableItems, MediaType } from '../../types';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import {
    YoutubeVideoCardComponent,
    YoutubeVideoCardDestination,
    YoutubeVideoCardMetaVariant,
} from '../youtube-video-card/youtube-video-card.component';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';

@Component({
    selector: 'app-videos-grid',
    imports: [
        YoutubeVideoComponent,
        YoutubeVideoCardComponent,
        SkeletonComponent,
    ],
    templateUrl: './videos-grid.component.html',
    styleUrl: './videos-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideosGridComponent implements OnChanges {
    @Input() state: LoadableItems<Video> = { type: 'idle' };
    @Input() featuredCount = VIDEOS_GRID_FEATURED_COUNT;
    @Input() gridCount = GRID_COUNT;
    @Input() mediaTitle = '';
    @Input() mediaYear = '';
    @Input() mediaId?: number;
    @Input() mediaType?: MediaType;
    @Input() cardDestination: YoutubeVideoCardDestination = 'youtube';
    @Input() cardMetaVariant: YoutubeVideoCardMetaVariant = 'compact';
    featuredSkeletonItems: readonly number[] = [];
    gridSkeletonItems: readonly number[] = [];
    featuredVideos: readonly Video[] = [];
    gridVideos: readonly Video[] = [];

    ngOnChanges(): void {
        this.featuredSkeletonItems = createIndexes(this.featuredCount);
        this.gridSkeletonItems = createIndexes(this.gridCount);

        if (
            this.state.type === 'loaded' ||
            this.state.type === 'loading-more'
        ) {
            this.featuredVideos = this.state.value.slice(0, this.featuredCount);
            this.gridVideos = this.state.value.slice(
                this.featuredCount,
                this.featuredCount + this.gridCount,
            );
            return;
        }

        this.featuredVideos = [];
        this.gridVideos = [];
    }
}

function createIndexes(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
}

