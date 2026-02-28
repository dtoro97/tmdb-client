import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

@Component({
    selector: 'app-sub-page-banner',
    imports: [RouterLink, MediaThumbComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="banner">
            @if (backdropPath) {
                <app-media-thumb
                    class="banner-backdrop"
                    [src]="backdropPath"
                    [params]="'w1280'"
                />
                <div class="banner-gradient"></div>
            }
            <div class="banner-content inner-container">
                <a class="back-link" [routerLink]="backLink">
                    <i class="fa-solid fa-chevron-left"></i>
                    Back to {{ parentTitle }}
                </a>
                <h1 class="banner-title">{{ pageTitle }}</h1>
            </div>
        </div>
    `,
    styleUrl: './sub-page-banner.component.scss',
})
export class SubPageBannerComponent {
    @Input() backdropPath: string | null = null;
    @Input() parentTitle = '';
    @Input() backLink: string | string[] = ['../'];
    @Input() pageTitle = '';
}
