import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    PersonCarouselPanelComponent,
    RemoteData,
    SkeletonComponent,
} from '../../../shared';
import { type CreditsSummary } from './media-credits-summary.model';

@Component({
    selector: 'app-media-credits-summary',
    imports: [
        RouterLink,
        PersonCarouselPanelComponent,
        SkeletonComponent,
    ],
    templateUrl: './media-credits-summary.component.html',
    styleUrl: './media-credits-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCreditsSummaryComponent {
    @Input({ required: true }) data!: RemoteData<CreditsSummary | null>;
}
