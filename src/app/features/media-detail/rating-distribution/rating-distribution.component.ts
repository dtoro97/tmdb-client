import { DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';

import { Review } from '../../../api';
import { VoteCountPipe } from '../../../shared';

interface RatingBucket {
    readonly label: number;
    readonly count: number;
    readonly height: number;
}

const RATING_BUCKET_COUNT = 10;
const EMPTY_COUNTS = Array.from({ length: RATING_BUCKET_COUNT }, () => 0);
const EMPTY_BUCKETS = createBuckets(EMPTY_COUNTS);

@Component({
    selector: 'app-rating-distribution',
    imports: [DecimalPipe, VoteCountPipe],
    templateUrl: './rating-distribution.component.html',
    styleUrl: './rating-distribution.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDistributionComponent implements OnChanges {
    @Input() average: number | null | undefined = null;
    @Input() voteCount: number | null | undefined = null;
    @Input() reviews: Review[] = [];

    tmdbAverage: number | null = null;
    tmdbVoteCount = 0;
    reviewRatedCount = 0;
    hasReviewRatings = false;
    buckets: readonly RatingBucket[] = EMPTY_BUCKETS;

    ngOnChanges(): void {
        this.tmdbAverage = normalizeAverage(this.average);
        this.tmdbVoteCount = normalizeVoteCount(this.voteCount);

        const counts = getRatingCounts(this.reviews);
        this.reviewRatedCount = counts.reduce(
            (total, count) => total + count,
            0,
        );
        this.hasReviewRatings = this.reviewRatedCount > 0;
        this.buckets = createBuckets(counts);
    }
}

function normalizeAverage(average: number | null | undefined): number | null {
    return average != null && average > 0 ? average : null;
}

function normalizeVoteCount(voteCount: number | null | undefined): number {
    return voteCount != null && voteCount > 0 ? voteCount : 0;
}

function getRatingCounts(reviews: readonly Review[]): number[] {
    const counts = [...EMPTY_COUNTS];

    for (const review of reviews) {
        const rating = review.author_details?.rating;
        if (typeof rating !== 'number') {
            continue;
        }

        const normalizedRating = Math.round(Math.min(10, Math.max(1, rating)));
        counts[normalizedRating - 1] += 1;
    }

    return counts;
}

function createBuckets(counts: readonly number[]): RatingBucket[] {
    const maxCount = Math.max(...counts, 0);

    return counts.map((count, index) => ({
        label: index + 1,
        count,
        height: maxCount > 0 ? (count / maxCount) * 100 : 0,
    }));
}
