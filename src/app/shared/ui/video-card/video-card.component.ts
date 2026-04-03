import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { VideoCardItem } from '../../models';
import { ImageComponent } from '../image/image.component';

@Component({
    selector: 'app-video-card',
    imports: [RouterLink, ImageComponent],
    templateUrl: './video-card.component.html',
    styleUrl: './video-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCardComponent {
    @Input({ required: true }) item!: VideoCardItem;

    openVideo(): void {
        window.open(
            this.item.videoUrl,
            '_blank',
            'noopener,noreferrer',
        );
    }
}
