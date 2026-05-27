import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';

import { EMPTY, catchError, tap } from 'rxjs';

import {
    EmptyStateComponent,
    RepeatPipe,
    SkeletonComponent,
    SnackbarComponent,
    SnackbarService,
    SnackbarType,
    SubPageHeaderComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaReviewsStoreService } from '../media-reviews-store.service';
import { ReviewCardComponent } from '../review-card/review-card.component';

@Component({
    selector: 'app-media-reviews-page',
    imports: [
        AsyncPipe,
        NgTemplateOutlet,
        MatButtonModule,
        EmptyStateComponent,
        RepeatPipe,
        ReviewCardComponent,
        SkeletonComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './reviews-page.component.html',
    styleUrl: './reviews-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaReviewsPageComponent {
    readonly skeletonCount = 5;

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaReviewsStoreService: MediaReviewsStoreService,
        private snackbar: SnackbarService,
        private title: Title,
    ) {
        this.mediaStoreService.title$
            .pipe(
                tap((mediaTitle) =>
                    this.title.setTitle(`${mediaTitle} | Reviews`),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    loadMore(): void {
        this.mediaReviewsStoreService
            .loadMoreReviews$()
            .pipe(
                catchError(() => {
                    this.snackbar.openSnackbar(SnackbarComponent, {
                        message: 'Could not load more reviews.',
                        type: SnackbarType.Error,
                    });
                    return EMPTY;
                }),
            )
            .subscribe();
    }
}
