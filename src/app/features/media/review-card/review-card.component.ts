import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { Review } from '../../../api';
import { ImagePipe, RatingBadgeComponent } from '../../../shared';

@Component({
    selector: 'app-review-card',
    imports: [DatePipe, ImagePipe, RatingBadgeComponent],
    templateUrl: './review-card.component.html',
    styleUrl: './review-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCardComponent {
    @Input({ required: true })
    set review(review: Review) {
        this.contentHtml = review.content ?? '';
        this.createdAt = review.created_at ?? null;
        this.userRating = review.author_details?.rating ?? null;
        this.avatarPath = review.author_details?.avatar_path?.trim() || null;

        const displayName =
            review.author?.trim() ||
            review.author_details?.username?.trim() ||
            'Anonymous';
        this.displayName = displayName;
        this.fallbackInitial = displayName.charAt(0).toUpperCase() || 'A';

        this.expanded = false;
        this.canExpand = this.isReviewLong(this.contentHtml);
    }

    contentHtml = '';
    createdAt: string | null = null;
    displayName = 'Anonymous';
    fallbackInitial = 'A';
    avatarPath: string | null = null;
    userRating: number | null = null;
    expanded = false;
    canExpand = false;

    toggleExpanded(): void {
        this.expanded = !this.expanded;
    }

    isReviewLong(content: string): boolean {
        const plainText = content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return plainText.length > 500;
    }
}
