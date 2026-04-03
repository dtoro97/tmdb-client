import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';

import { ImageComponent } from '../image/image.component';

export type HeroSurfaceVariant = 'detail' | 'compact';

@Component({
    selector: 'app-hero-surface',
    imports: [ImageComponent],
    templateUrl: './hero-surface.component.html',
    styleUrl: './hero-surface.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSurfaceComponent {
    @Input() backdropPath: string | null = null;
    @Input() alt = '';
    @Input() variant: HeroSurfaceVariant = 'detail';
}
