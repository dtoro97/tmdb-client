import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, map, switchMap, tap } from 'rxjs';

import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaReviewsStoreService } from '../media-reviews-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { MediaType, RATING_ACTIONS } from '../../../shared';
import { MediaDetailActionsStore } from '../media-detail-actions-store.service';

@Component({
    selector: 'app-media-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [
        MediaDetailStoreService,
        MediaDetailActionsStore,
        MediaReviewsStoreService,
        MediaSeasonsStoreService,
        MediaVideoStoreService,
        { provide: RATING_ACTIONS, useExisting: MediaDetailActionsStore },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaWrapperComponent {
    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaActionsStoreService: MediaDetailActionsStore,
        public mediaReviewsStoreService: MediaReviewsStoreService,
        public mediaVideoStoreService: MediaVideoStoreService,
        private route: ActivatedRoute,
    ) {
        this.route.paramMap
            .pipe(
                tap(() => {
                    this.mediaStoreService.resetState();
                    this.mediaActionsStoreService.resetState();
                    this.mediaReviewsStoreService.resetState();
                    this.mediaVideoStoreService.resetState();
                }),
                switchMap((params) => {
                    const id = Number(params.get('id'));
                    const type = params.get('type')! as MediaType;
                    return combineLatest([
                        this.mediaStoreService.getDetails$(id, type),
                        this.mediaReviewsStoreService.loadReviews$(id, type),
                        this.mediaVideoStoreService.getVideos$(id, type),
                    ]).pipe(map(() => undefined));
                }),
            )
            .pipe(takeUntilDestroyed())
            .subscribe();
    }
}
