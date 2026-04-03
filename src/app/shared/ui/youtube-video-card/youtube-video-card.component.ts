import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Video } from '../../../api';
import { MediaType } from '../../types';
import {
    buildYoutubeThumbnailUrl,
    buildYoutubeWatchUrl,
} from '../../utils/youtube';
import { BadgeComponent } from '../badge/badge.component';

export type YoutubeVideoCardDestination = 'youtube' | 'detail';
export type YoutubeVideoCardMetaVariant = 'compact' | 'detailed';

@Component({
    selector: 'app-youtube-video-card',
    imports: [DatePipe, BadgeComponent, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './youtube-video-card.component.html',
    styleUrl: './youtube-video-card.component.scss',
})
export class YoutubeVideoCardComponent implements OnChanges {
    @Input({ required: true }) video!: Video;
    @Input() mediaTitle = '';
    @Input() mediaYear = '';
    @Input() mediaId?: number;
    @Input() mediaType?: MediaType;
    @Input() destination: YoutubeVideoCardDestination = 'youtube';
    @Input() metaVariant: YoutubeVideoCardMetaVariant = 'compact';
    @Input() linkToMedia = false;

    thumbnailUrl = '';
    openLabel = 'Open video';
    showOfficialBadge = false;
    showSupplementalMeta = false;

    constructor(private router: Router) {}

    ngOnChanges(): void {
        const videoKey = this.video.key ?? '';
        const videoName = (this.video.name ?? this.mediaTitle) || 'video';

        this.thumbnailUrl = videoKey
            ? buildYoutubeThumbnailUrl(videoKey)
            : '';
        this.openLabel = `Open video: ${videoName}`;
        this.showOfficialBadge =
            this.metaVariant === 'detailed' && !!this.video.official;
        this.showSupplementalMeta =
            this.metaVariant === 'detailed' &&
            (!!this.video.published_at || !!this.video.size);
    }

    onOpen(): void {
        if (
            this.destination === 'detail' &&
            this.mediaId &&
            this.mediaType &&
            this.video.id
        ) {
            this.router.navigate([
                '/title',
                this.mediaId,
                this.mediaType,
                'videos',
                this.video.id,
            ]);
            return;
        }

        if (!this.video.key) {
            return;
        }

        window.open(
            buildYoutubeWatchUrl(this.video.key),
            '_blank',
            'noopener,noreferrer',
        );
    }
}
