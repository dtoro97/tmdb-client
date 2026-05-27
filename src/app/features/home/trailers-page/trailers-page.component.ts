import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';

import { PAGE_SIZE } from '../../../constants';
import { PillToggleComponent, SelectOption, SkeletonComponent, VideoCardComponent } from '../../../shared';
import { RepeatPipe } from '../../../shared/pipes/repeat.pipe';
import { HeroSpotlightComponent } from '../hero-spotlight/hero-spotlight.component';
import { TrailersPageStoreService } from './trailers-page-store.service';
import type { TrailerFeedType } from '../trailer-data-store.service';

const toTrailerFeedType = (value: unknown): TrailerFeedType => (value === 'new' ? 'new' : 'trending');

const isTrailerFeedType = (value: unknown): value is TrailerFeedType => value === 'new' || value === 'trending';

@Component({
    selector: 'app-trailers-page',
    imports: [
        AsyncPipe,
        HeroSpotlightComponent,
        MatButtonModule,
        PillToggleComponent,
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
    readonly feedOptions: SelectOption<TrailerFeedType>[] = [
        { label: 'Trending', value: 'trending' },
        { label: 'New', value: 'new' },
    ];
    readonly vm$ = this.store.vm$;
    readonly skeletonCount = PAGE_SIZE;

    constructor(
        public readonly store: TrailersPageStoreService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.route.paramMap
            .pipe(
                map((params) => params.get('feedType')),
                tap((feedType) => {
                    if (!isTrailerFeedType(feedType)) {
                        this.router.navigate(['/trailers', 'trending'], {
                            replaceUrl: true,
                        });
                    }
                }),
                filter(isTrailerFeedType),
                switchMap((feedType) => this.store.load$(feedType)),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    openTrailer(url: string) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    showMoreSelected() {
        this.store.showMoreSelected$().subscribe();
    }

    feedSelected(value: unknown): void {
        this.router.navigate(['/trailers', toTrailerFeedType(value)]);
    }
}
