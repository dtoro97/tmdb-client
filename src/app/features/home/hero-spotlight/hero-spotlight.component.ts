import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    HeroSurfaceComponent,
    RatingComponent,
    WatchlistToggleComponent,
} from '../../../shared';
import type { SpotlightItem } from '../spotlight-item';

@Component({
    selector: 'app-hero-spotlight',
    imports: [
        RouterLink,
        HeroSurfaceComponent,
        RatingComponent,
        WatchlistToggleComponent,
    ],
    templateUrl: './hero-spotlight.component.html',
    styleUrl: './hero-spotlight.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSpotlightComponent {
    @Input() loading = false;
    @Input() badge = '';
    @Input() spotlight: SpotlightItem | null = null;
    @Input() backLink: string | null = null;
    @Input() backLabel = '';
}
