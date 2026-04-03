import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

import { PAGE_SIZE } from '../../../constants';
import {
    HeroSurfaceComponent,
    MediaType,
    SkeletonComponent,
    YoutubeVideoCardComponent,
} from '../../../shared';
import { RepeatPipe } from '../../../shared/pipes/repeat.pipe';
import { TrailersPageStoreService } from './trailers-page-store.service';

@Component({
    selector: 'app-trailers-page',
    imports: [
        AsyncPipe,
        HeroSurfaceComponent,
        MatButtonModule,
        YoutubeVideoCardComponent,
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

    constructor(
        public readonly store: TrailersPageStoreService,
        private router: Router,
    ) {
        this.store.load$().pipe(takeUntilDestroyed()).subscribe();
    }

    openTrailer(url: string) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    openMedia(mediaLink: [string, number, MediaType]) {
        this.router.navigate(mediaLink);
    }

    showMoreSelected() {
        this.store.showMoreSelected$().subscribe();
    }
}
