import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { Review, ReviewPage } from '../../api';
import { PAGE_SIZE } from '../../constants';
import { LoadableItems } from '../../shared';
import type { MediaType } from '../../shared';
import { MediaApiService } from './media-api.service';

const REVIEW_PREVIEW_COUNT = 3;
const REVIEW_PREVIEW_MIN_CONTENT_LENGTH = 100;

interface ReviewPaginationState {
    page: number;
    totalPages: number;
    totalResults: number;
}

interface MediaReviewsState {
    reviews: LoadableItems<Review>;
    pagination: ReviewPaginationState;
    mediaId: number | null;
    mediaType: MediaType | '';
}

const INITIAL_STATE: MediaReviewsState = {
    reviews: { type: 'idle' },
    pagination: { page: 0, totalPages: 0, totalResults: 0 },
    mediaId: null,
    mediaType: '',
};

@Injectable()
export class MediaReviewsStoreService extends ComponentStore<MediaReviewsState> {
    readonly reviewsState$ = this.select((state) => state.reviews);

    readonly totalResults$ = this.select((state) => state.pagination.totalResults);

    readonly hasMore$ = this.select((state) => state.pagination.page < state.pagination.totalPages);

    readonly previewReviews$ = this.reviewsState$.pipe(
        map((state) => {
            const reviews = state.type === 'loaded' ? state.value : [];
            return this.sortReviews(
                reviews.filter((review) => (review.content?.trim().length ?? 0) >= REVIEW_PREVIEW_MIN_CONTENT_LENGTH),
            ).slice(0, REVIEW_PREVIEW_COUNT);
        }),
    );

    constructor(private readonly mediaApiService: MediaApiService) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    loadReviews$(id: number, type: MediaType): Observable<ReviewPage | null> {
        this.patchState({
            reviews: { type: 'loading' },
            mediaId: id,
            mediaType: type,
            pagination: { page: 0, totalPages: 0, totalResults: 0 },
        });

        return this.mediaApiService.getReviews$(id, type, 1).pipe(
            catchError(() => of(null as ReviewPage | null)),
            tap((reviewPage) => {
                this.patchState({
                    reviews: {
                        type: 'loaded',
                        value: reviewPage?.results ?? [],
                    },
                    pagination: {
                        page: reviewPage?.page ?? 1,
                        totalPages: reviewPage?.total_pages ?? 1,
                        totalResults: reviewPage?.total_results ?? 0,
                    },
                });
            }),
        );
    }

    loadMoreReviews$(): Observable<ReviewPage | undefined> {
        const { pagination, reviews, mediaId, mediaType } = this.get();
        const currentReviews = reviews.type === 'loaded' || reviews.type === 'loading-more' ? reviews.value : [];

        if (!mediaId || !mediaType || pagination.page >= pagination.totalPages || reviews.type === 'loading-more') {
            return of(undefined);
        }

        this.patchState({
            reviews: {
                type: 'loading-more',
                value: currentReviews,
                placeholderCount: PAGE_SIZE,
            },
        });

        return this.mediaApiService.getReviews$(mediaId, mediaType as MediaType, pagination.page + 1).pipe(
            tap((reviewPage) => {
                this.patchState({
                    reviews: {
                        type: 'loaded',
                        value: [...currentReviews, ...(reviewPage.results ?? [])],
                    },
                    pagination: {
                        page: reviewPage?.page ?? pagination.page + 1,
                        totalPages: reviewPage?.total_pages ?? pagination.totalPages,
                        totalResults: reviewPage?.total_results ?? pagination.totalResults,
                    },
                });
            }),
            catchError((error) => {
                this.patchState({
                    reviews: { type: 'loaded', value: currentReviews },
                });
                return throwError(() => error);
            }),
        );
    }

    private sortReviews(reviews: Review[]): Review[] {
        return [...reviews].sort((left, right) => {
            const leftHasRating = typeof left.author_details?.rating === 'number';
            const rightHasRating = typeof right.author_details?.rating === 'number';

            if (leftHasRating === rightHasRating) {
                return 0;
            }

            return leftHasRating ? -1 : 1;
        });
    }
}
