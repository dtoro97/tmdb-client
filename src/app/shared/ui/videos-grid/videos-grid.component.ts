import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { Video } from '../../../api';
import { GRID_COUNT } from '../../../constants';
import { RepeatPipe } from '../../pipes';
import type { VideoCardItem } from '../../models';
import type { LoadableItems } from '../../types';
import {
    buildYoutubeThumbnailUrl,
    buildYoutubeWatchUrl,
    toYoutubeTrailerFirstVideoState,
} from '../../utils/youtube';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { VideoCardComponent } from '../video-card/video-card.component';

@Component({
    selector: 'app-videos-grid',
    imports: [
        NgTemplateOutlet,
        RepeatPipe,
        VideoCardComponent,
        SkeletonComponent,
    ],
    templateUrl: './videos-grid.component.html',
    styleUrl: './videos-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideosGridComponent implements OnChanges {
    @Input() state: LoadableItems<Video> = { type: 'idle' };
    @Input() gridCount = GRID_COUNT;
    items: readonly VideoCardItem[] = [];

    ngOnChanges(): void {
        if (
            this.state.type === 'loaded' ||
            this.state.type === 'loading-more'
        ) {
            const state = toYoutubeTrailerFirstVideoState(this.state);
            const videos =
                state.type === 'loaded' || state.type === 'loading-more'
                    ? state.value
                    : [];
            const items = videos.flatMap((video) => {
                const item = this.toVideoCardItem(video);
                return item ? [item] : [];
            });
            const limit = Math.max(this.gridCount, 0);

            this.items = items.slice(0, limit);
            return;
        }

        this.items = [];
    }

    private toVideoCardItem(video: Video): VideoCardItem | null {
        if (!video.id || !video.key) {
            return null;
        }

        const title = video.name ?? 'Video';

        return {
            id: video.id,
            title,
            thumbnailUrl: buildYoutubeThumbnailUrl(video.key),
            alt: title,
            openLabel: `Open video: ${title}`,
            typeLabel: video.type,
            publishedAt: video.published_at,
            href: buildYoutubeWatchUrl(video.key),
        };
    }
}

