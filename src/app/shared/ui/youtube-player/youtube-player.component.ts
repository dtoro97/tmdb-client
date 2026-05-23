import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';

import { Video } from '../../../api';
import { YoutubeLinkPipe } from '../../pipes';

@Component({
    selector: 'app-youtube-player',
    imports: [YoutubeLinkPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './youtube-player.component.html',
    styleUrl: './youtube-player.component.scss',
})
export class YoutubePlayerComponent {
    @Input({ required: true }) video!: Video;
}
