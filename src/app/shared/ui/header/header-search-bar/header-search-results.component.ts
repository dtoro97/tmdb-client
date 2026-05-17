import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { LoadableItems, SearchResultItem } from '../../..';
import { BadgeComponent } from '../../badge/badge.component';
import { ImageComponent } from '../../image/image.component';
import { RatingComponent } from '../../rating/rating.component';

@Component({
    selector: 'app-header-search-results',
    standalone: true,
    imports: [BadgeComponent, RatingComponent, ImageComponent],
    templateUrl: './header-search-results.component.html',
    styleUrl: './header-search-results.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderSearchResultsComponent {
    @Input({ required: true }) state!: LoadableItems<SearchResultItem>;
    @Output() readonly resultSelected = new EventEmitter<SearchResultItem>();

    readonly skeletonRows = Array.from({ length: 5 });

    selectResult(item: SearchResultItem): void {
        this.resultSelected.emit(item);
    }
}
