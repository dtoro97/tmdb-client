import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { catchError, distinctUntilChanged, map, of, shareReplay, startWith, switchMap, tap } from 'rxjs';

import {
    EmptyStateComponent,
    ImageComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    remoteSuccess,
} from '../../../shared';
import { MediaApiService } from '../media-api.service';
import { MediaStoreService } from '../media-store.service';
import { ReviewCardComponent } from '../review-card/review-card.component';

@Component({
    selector: 'app-review-detail-page',
    imports: [AsyncPipe, EmptyStateComponent, ImageComponent, ReviewCardComponent, SkeletonComponent, SubPageHeaderComponent],
    templateUrl: './review-detail-page.component.html',
    styleUrl: './review-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDetailPageComponent {
    readonly reviewState$ = this.route.paramMap.pipe(
        map((params) => params.get('reviewId')),
        distinctUntilChanged(),
        switchMap((reviewId) => {
            if (!reviewId) {
                return of(remoteSuccess(null));
            }

            return this.mediaApiService.getReviewDetails$(reviewId).pipe(
                map((review) => remoteSuccess(review)),
                catchError(() => of(remoteSuccess(null))),
                startWith({ state: 'loading' as const }),
            );
        }),
        tap((state) => {
            if (state.state === 'success' && state.data?.media_title) {
                this.title.setTitle(`${state.data.media_title} | Review`);
            }
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    constructor(
        public readonly mediaStore: MediaStoreService,
        private readonly mediaApiService: MediaApiService,
        private readonly route: ActivatedRoute,
        private readonly title: Title,
    ) {}
}
