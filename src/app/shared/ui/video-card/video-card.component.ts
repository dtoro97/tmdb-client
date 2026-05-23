import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { VideoCardItem } from '../../models';

@Component({
    selector: 'app-video-card',
    imports: [DatePipe, NgTemplateOutlet, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './video-card.component.html',
    styleUrl: './video-card.component.scss',
})
export class VideoCardComponent {
    @Input({ required: true }) item!: VideoCardItem;
}
