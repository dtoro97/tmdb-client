import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { marked } from 'marked';

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
    private readonly EXPAND_THRESHOLD = 500;

    @Input({ required: true })
    set review(review: Review) {
        const contentMarkdown = review.content ?? '';

        this._review = review;
        this.contentHtml = this.renderMarkdown(contentMarkdown);
        this.contentPreviewHtml = contentMarkdown;
        this.initial = review.author!.trim().charAt(0).toUpperCase();
        this.expandable = (review.content?.length || 0) > this.EXPAND_THRESHOLD;
    }

    get review(): Review {
        return this._review;
    }
    private _review: Review;
    contentHtml = '';
    contentPreviewHtml = '';
    initial = 'A';
    expanded = false;
    expandable = false;

    toggleExpanded(): void {
        this.expanded = !this.expanded;
    }

    private renderMarkdown(content: string): string {
        const rendered = marked.parse(content, {
            breaks: true,
            gfm: true,
        });

        return typeof rendered === 'string' ? rendered : content;
    }
}
