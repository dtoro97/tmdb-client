import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    PersonCarouselPanelComponent,
    SkeletonComponent,
} from '../../../shared';
import { MediaCreditsPanelData } from '../media-detail.models';

@Component({
    selector: 'app-media-credits-panel',
    imports: [
        RouterLink,
        PersonCarouselPanelComponent,
        SkeletonComponent,
    ],
    templateUrl: './media-credits-panel.component.html',
    styleUrl: './media-credits-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCreditsPanelComponent {
    @Input({ required: true }) data!: MediaCreditsPanelData;
}
