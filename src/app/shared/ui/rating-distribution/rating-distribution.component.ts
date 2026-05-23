import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

interface RatingBucket {
    readonly label: number;
    readonly count: number;
    readonly height: number;
}

@Component({
    selector: 'app-rating-distribution',
    imports: [DecimalPipe],
    templateUrl: './rating-distribution.component.html',
    styleUrl: './rating-distribution.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDistributionComponent implements OnChanges {
    @Input() ratings: readonly number[] = [];
    @Input() summaryLabel = 'Rating summary';
    @Input() summaryValue: number | null = null;
    @Input() summaryMeta: string | null = null;
    @Input() distributionLabel = 'Ratings';
    @Input() distributionMeta: string | null = null;
    @Input() distributionAriaLabel = 'Rating distribution';
    @Input() distributionEmptyText = 'No ratings yet.';

    hasRatings = false;
    resolvedDistributionMeta = '0 rated';
    RATING_BUCKET_COUNT = 10;
    buckets: readonly RatingBucket[] = this.createBuckets(this.createEmptyCounts());

    ngOnChanges(): void {
        const counts = this.getRatingCounts(this.ratings);
        const ratedCount = counts.reduce((total, count) => total + count, 0);

        this.hasRatings = ratedCount > 0;
        this.resolvedDistributionMeta = this.distributionMeta ?? `${ratedCount} rated`;
        this.buckets = this.createBuckets(counts);
    }

    getRatingCounts(ratings: readonly number[]): number[] {
        const counts = this.createEmptyCounts();

        for (const rating of ratings) {
            if (typeof rating !== 'number' || Number.isNaN(rating)) {
                continue;
            }

            const normalizedRating = Math.round(Math.min(10, Math.max(1, rating)));
            counts[normalizedRating - 1] += 1;
        }

        return counts;
    }

    createBuckets(counts: readonly number[]): RatingBucket[] {
        const maxCount = Math.max(...counts, 0);

        return counts.map((count, index) => ({
            label: index + 1,
            count,
            height: maxCount > 0 ? (count / maxCount) * 100 : 0,
        }));
    }
    createEmptyCounts(): number[] {
        return Array.from({ length: this.RATING_BUCKET_COUNT }, () => 0);
    }
}
