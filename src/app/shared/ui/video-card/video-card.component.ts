import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

export interface VideoCardItem {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    mediaTitle: string;
    mediaYear?: string;
    mediaPosterPath?: string | null;
    videoId: string;
    videoKey: string;
    videoName: string;
    videoType?: string;
    videoPublishedAt?: string;
    videoOfficial?: boolean;
    videoDurationLabel?: string;
}

@Component({
    selector: 'app-video-card',
    imports: [RouterLink, DatePipe, MediaThumbComponent],
    templateUrl: './video-card.component.html',
    styleUrl: './video-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCardComponent {
    @Input({ required: true }) item!: VideoCardItem;
    @Input() showParentMediaLogo = false;

    get youtubeThumbnail(): string {
        return `https://img.youtube.com/vi/${this.item.videoKey}/hqdefault.jpg`;
    }
}
