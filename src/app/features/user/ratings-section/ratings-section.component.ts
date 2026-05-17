import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    MediaListComponent,
    PillToggleComponent,
    SortButtonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { UserRatingsStore } from '../user-ratings-store.service';
import { EpisodeRatingListComponent } from './episode-rating-list.component';

type RatingsTab = 'movies' | 'tv' | 'episodes';

const RATINGS_TABS = [
    { label: 'Movies', value: 'movies' as const },
    { label: 'TV Series', value: 'tv' as const },
    { label: 'Episodes', value: 'episodes' as const },
];

const SORT_OPTIONS = [{ label: 'Date Added', value: 'created_at' }];

@Component({
    selector: 'app-ratings-section',
    imports: [
        AsyncPipe,
        MatButtonModule,
        BrowseToolbarComponent,
        EmptyStateComponent,
        EpisodeRatingListComponent,
        MediaListComponent,
        PillToggleComponent,
        SortButtonComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './ratings-section.component.html',
    styleUrl: './ratings-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingsSectionComponent {
    readonly vm$ = this.store.userRatingsVm$;
    readonly tabs = RATINGS_TABS;
    readonly sortOptions = SORT_OPTIONS;
    selectedTab: RatingsTab = 'movies';

    constructor(private readonly store: UserRatingsStore) {}

    onTabChange(tab: unknown): void {
        this.selectedTab = tab as RatingsTab;
    }

    onToggleSortDirection(): void {
        this.store.changeSortDirection$().subscribe();
    }

    onShowMore(): void {
        if (this.selectedTab === 'movies') {
            this.store.loadMoreMovies$().subscribe();
        } else if (this.selectedTab === 'tv') {
            this.store.loadMoreTv$().subscribe();
        } else {
            this.store.loadMoreEpisodes$().subscribe();
        }
    }
}
