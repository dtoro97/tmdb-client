import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import {
    HeroSurfaceComponent,
    LoadableValue,
    RatingComponent,
} from '../../../shared';
import { SpotlightItem } from './home-spotlight.models';

@Component({
    selector: 'app-home-spotlight',
    imports: [
        RouterLink,
        MatButtonModule,
        HeroSurfaceComponent,
        RatingComponent,
    ],
    templateUrl: './home-spotlight.component.html',
    styleUrl: './home-spotlight.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSpotlightComponent {
    @Input({ required: true }) state!: LoadableValue<SpotlightItem | null>;
}
