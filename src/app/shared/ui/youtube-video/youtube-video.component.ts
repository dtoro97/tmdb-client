import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { Video } from '../../../api';
import { YoutubeLinkPipe } from '../../pipes';
import { Router } from '@angular/router';

@Component({
    selector: 'app-youtube-video',
    imports: [DatePipe, YoutubeLinkPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './youtube-video.component.html',
    styleUrl: './youtube-video.component.scss',
})
export class YoutubeVideoComponent {
    @Input({ required: true }) video!: Video;
    @Input() variant: 'embed' | 'card' = 'card';
    @Input() mediaTitle = '';
    @Input() mediaYear = '';
    @Input() showTypeBadge = true;
    @Input() showOfficialBadge = false;
    @Input() showPublishedDate = false;
    @Input() showQuality = false;
    @Input() showTitle = true;
    @Input() navigateToVideoDetail = false;
    @Input() mediaId?: number;
    @Input() mediaType?: 'movie' | 'tv';

    constructor(private router: Router) {}

    getYoutubeThumbnail(key: string): string {
        return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
    }

    getYoutubeUrl(key: string): string {
        return `https://www.youtube.com/watch?v=${key}`;
    }

    openVideo(key: string): void {
        window.open(this.getYoutubeUrl(key), '_blank', 'noopener,noreferrer');
    }

    onCardClick(): void {
        if (
            this.navigateToVideoDetail &&
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
        this.openVideo(this.video.key);
    }
}
