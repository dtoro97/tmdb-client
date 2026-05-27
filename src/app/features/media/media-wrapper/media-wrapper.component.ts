import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { map, tap } from 'rxjs';

import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaReviewsStoreService } from '../media-reviews-store.service';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { MediaType, RATING_ACTIONS } from '../../../shared';
import { MediaDetailActionsStore } from '../media-detail-actions-store.service';
import { EpisodeDetailStoreService } from '../episode-detail-page/episode-detail-store.service';

@Component({
    selector: 'app-media-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [
        MediaDetailStoreService,
        MediaDetailActionsStore,
        EpisodeDetailStoreService,
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
        private route: ActivatedRoute,
    ) {
        this.route.paramMap
            .pipe(
                tap(() => {
                    this.mediaActionsStoreService.resetState();
                }),
                map((params) => ({
                    id: Number(params.get('id')),
                    type: params.get('type')! as MediaType,
                })),
            )
            .pipe(takeUntilDestroyed())
            .subscribe((params) => {
                this.mediaStoreService.loadPage(params);
            });
    }
}
