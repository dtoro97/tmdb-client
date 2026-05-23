import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeroSurfaceComponent } from '../hero-surface/hero-surface.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-sub-page-header',
    imports: [RouterLink, HeroSurfaceComponent, SkeletonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sub-page-header.component.html',
    styleUrl: './sub-page-header.component.scss',
})
export class SubPageHeaderComponent {
    @Input() backdropPath: string | null = null;
    @Input() parentTitle: string | null = null;
    @Input() backLink: string | readonly string[] | null = ['../'];
    @Input() pageTitle: string | null = null;
    @Input() subtitle: string | null = null;
    @Input() loading = false;
}
