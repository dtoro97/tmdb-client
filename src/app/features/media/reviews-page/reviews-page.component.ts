import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, catchError, tap } from 'rxjs';

import {
    EmptyStateComponent,
    RepeatPipe,
    SkeletonComponent,
    SubPageHeaderComponent,
    toUserFacingErrorMessage,
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
        private snackBar: MatSnackBar,
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
                catchError((error) => {
                    this.snackBar.open(
                        toUserFacingErrorMessage(error, 'Could not load more reviews.'),
                        'Dismiss',
                        { duration: 5000, panelClass: 'snackbar-error' },
                    );
                    return EMPTY;
                }),
            )
            .subscribe();
    }
}
