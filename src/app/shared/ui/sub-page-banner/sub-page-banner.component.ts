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
                <div class="banner-scrim"></div>
            } @else {
                <div class="banner-solid"></div>
            }
            <div class="banner-content inner-container">
                @if (backLink) {
                    <a class="back-link" [routerLink]="backLink">
                        <i class="fa-solid fa-chevron-left"></i>
                        Back to {{ parentTitle }}
                    </a>
                }
                @if (kicker) {
                    <p class="banner-kicker m-0">{{ kicker }}</p>
                }
                <h1 class="banner-title">{{ pageTitle }}</h1>
                @if (subtitle) {
                    <p class="banner-subtitle m-0">{{ subtitle }}</p>
                }
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
    @Input() subtitle = '';
    @Input() kicker = '';
}
