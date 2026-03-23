import { DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
} from '@angular/core';

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
    imports: [DecimalPipe],
    templateUrl: './rating-distribution.component.html',
    styleUrl: './rating-distribution.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDistributionComponent implements OnChanges {
    @Input() ratings: readonly number[] = [];
    @Input() ariaLabel = 'Ratings overview';
    @Input() summaryLabel: string | null = null;
    @Input() summaryValue: number | null = null;
    @Input() summaryValueSuffix = '/10';
    @Input() summaryMeta: string | null = null;
    @Input() summaryEmptyText: string | null = null;
    @Input() distributionLabel = 'Ratings';
    @Input() distributionMeta: string | null = null;
    @Input() distributionAriaLabel = 'Rating distribution';
    @Input() distributionEmptyText = 'No ratings yet.';

    hasSummary = false;
    hasRatings = false;
    ratedCount = 0;
    resolvedDistributionMeta = '0 rated';
    buckets: readonly RatingBucket[] = EMPTY_BUCKETS;

    ngOnChanges(): void {
        const counts = getRatingCounts(this.ratings);

        this.hasSummary =
            this.summaryLabel !== null ||
            this.summaryValue !== null ||
            this.summaryMeta !== null ||
            this.summaryEmptyText !== null;
        this.ratedCount = counts.reduce((total, count) => total + count, 0);
        this.hasRatings = this.ratedCount > 0;
        this.resolvedDistributionMeta =
            this.distributionMeta ?? `${this.ratedCount} rated`;
        this.buckets = createBuckets(counts);
    }
}

function getRatingCounts(ratings: readonly number[]): number[] {
    const counts = [...EMPTY_COUNTS];

    for (const rating of ratings) {
        if (typeof rating !== 'number' || Number.isNaN(rating)) {
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
