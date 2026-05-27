import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { VoteCountPipe } from '../../pipes';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-tmdb-rating',
    imports: [DecimalPipe, SkeletonComponent, VoteCountPipe],
    templateUrl: './tmdb-rating.component.html',
    styleUrl: './tmdb-rating.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TmdbRatingComponent {
    @Input() value: number | null | undefined = null;
    @Input() voteCount: number | null | undefined = null;
    @Input() label = 'Rating';
    @Input() emptyText = 'No ratings yet';
    @Input() loading = false;
}
