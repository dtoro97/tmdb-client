import { Review, ReviewPage } from '../../api';

export const normalizeAllReviews = (
    reviewPage: ReviewPage | null | undefined,
): Review[] =>
    (reviewPage?.results ?? []).filter(
        (review): review is Review => !!review.id && !!review.content?.trim(),
    );

export const sortReviewsForPreview = (reviews: Review[]): Review[] =>
    [...reviews].sort((left, right) => {
        const leftHasRating = typeof left.author_details?.rating === 'number';
        const rightHasRating = typeof right.author_details?.rating === 'number';

        if (leftHasRating === rightHasRating) {
            return 0;
        }

        return leftHasRating ? -1 : 1;
    });
