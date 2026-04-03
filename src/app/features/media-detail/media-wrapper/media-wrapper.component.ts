import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, map, switchMap, tap } from 'rxjs';

import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { MediaType } from '../../../shared';
@Component({
    selector: 'app-media-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [
        MediaDetailStoreService,
        MediaSeasonsStoreService,
        MediaVideoStoreService,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaWrapperComponent {
    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaVideoStoreService: MediaVideoStoreService,
        private route: ActivatedRoute,
    ) {
        this.route.paramMap
            .pipe(
                tap(() => {
                    this.mediaStoreService.resetState();
                    this.mediaVideoStoreService.resetState();
                }),
                switchMap((params) => {
                    const id = Number(params.get('id'));
                    const type = params.get('type')! as MediaType;
                    return combineLatest([
                        this.mediaStoreService.getDetails$(id, type),
                        this.mediaVideoStoreService.getVideos$(id, type),
                    ]).pipe(map(() => undefined));
                }),
            )

            .pipe(takeUntilDestroyed())
            .subscribe();
    }
}
