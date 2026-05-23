import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { Video } from '../../../api';
import { GRID_COUNT, VIDEOS_GRID_FEATURED_COUNT } from '../../../constants';
import { RepeatPipe } from '../../pipes';
import type { VideoCardItem } from '../../models';
import type { LoadableItems } from '../../types';
import {
    buildYoutubeThumbnailUrl,
    buildYoutubeWatchUrl,
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
    @Input() featuredCount = VIDEOS_GRID_FEATURED_COUNT;
    @Input() gridCount = GRID_COUNT;
    featuredItems: readonly VideoCardItem[] = [];
    gridItems: readonly VideoCardItem[] = [];

    ngOnChanges(): void {
        if (
            this.state.type === 'loaded' ||
            this.state.type === 'loading-more'
        ) {
            const items = this.state.value.flatMap((video) => {
                const item = this.toVideoCardItem(video);
                return item ? [item] : [];
            });

            this.featuredItems = items.slice(0, this.featuredCount);
            this.gridItems = items.slice(
                this.featuredCount,
                this.featuredCount + this.gridCount,
            );
            return;
        }

        this.featuredItems = [];
        this.gridItems = [];
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

