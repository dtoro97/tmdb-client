import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';

import { PAGE_SIZE } from '../../../constants';
import { SkeletonComponent, VideoCardComponent } from '../../../shared';
import { RepeatPipe } from '../../../shared/pipes/repeat.pipe';
import { HeroSpotlightComponent } from '../hero-spotlight/hero-spotlight.component';
import { TrailersPageStoreService } from './trailers-page-store.service';

@Component({
    selector: 'app-trailers-page',
    imports: [
        AsyncPipe,
        HeroSpotlightComponent,
        MatButtonModule,
        VideoCardComponent,
        SkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './trailers-page.component.html',
    styleUrl: './trailers-page.component.scss',
    providers: [TrailersPageStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailersPageComponent {
    readonly vm$ = this.store.vm$;
    readonly skeletonCount = PAGE_SIZE;

    constructor(public readonly store: TrailersPageStoreService) {
        this.store.load$().pipe(takeUntilDestroyed()).subscribe();
    }

    openTrailer(url: string) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    showMoreSelected() {
        this.store.showMoreSelected$().subscribe();
    }
}
