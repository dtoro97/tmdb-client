import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { marked } from 'marked';

import { Review, ReviewDetails } from '../../../api';
import { ImagePipe, RatingBadgeComponent } from '../../../shared';

export type ReviewCardVariant = 'preview' | 'list' | 'detail';
type ReviewCardItem = Review | ReviewDetails;

@Component({
    selector: 'app-review-card',
    imports: [DatePipe, ImagePipe, RatingBadgeComponent, RouterLink],
    templateUrl: './review-card.component.html',
    styleUrl: './review-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCardComponent {
    @Input({ required: true })
    set review(review: ReviewCardItem) {
        const contentMarkdown = review.content ?? '';

        this.currentReview = review;
        this.contentHtml = this.renderMarkdown(contentMarkdown);
        this.contentPreviewHtml = contentMarkdown;
        this.initial = this.toInitial(review);
    }

    @Input() variant: ReviewCardVariant = 'list';
    @Input() reviewLink: string | readonly unknown[] | null = null;

    currentReview: ReviewCardItem | null = null;
    contentHtml = '';
    contentPreviewHtml = '';
    initial = 'A';

    private renderMarkdown(content: string): string {
        const rendered = marked.parse(content, {
            breaks: true,
            gfm: true,
        });

        return typeof rendered === 'string' ? rendered : content;
    }

    private toInitial(review: ReviewCardItem): string {
        const label = review.author || review.author_details?.username || 'Anonymous';
        return label.trim().charAt(0).toUpperCase();
    }
}
