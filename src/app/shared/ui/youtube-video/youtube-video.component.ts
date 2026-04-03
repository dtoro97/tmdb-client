import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';

import { Video } from '../../../api';
import { YoutubeLinkPipe } from '../../pipes';
import { BadgeComponent } from '../badge/badge.component';

@Component({
    selector: 'app-youtube-video',
    imports: [YoutubeLinkPipe, BadgeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './youtube-video.component.html',
    styleUrl: './youtube-video.component.scss',
})
export class YoutubeVideoComponent {
    @Input({ required: true }) video!: Video;
    @Input() showTypeBadge = true;
}
