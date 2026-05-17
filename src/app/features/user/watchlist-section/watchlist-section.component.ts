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
import { UserWatchlistStore } from '../user-watchlist-store.service';

type WatchlistTab = 'movies' | 'tv';

const WATCHLIST_TABS = [
    { label: 'Movies', value: 'movies' as const },
    { label: 'TV Series', value: 'tv' as const },
];

const SORT_OPTIONS = [{ label: 'Date Added', value: 'created_at' }];

@Component({
    selector: 'app-watchlist-section',
    imports: [
        AsyncPipe,
        MatButtonModule,
        BrowseToolbarComponent,
        EmptyStateComponent,
        MediaListComponent,
        PillToggleComponent,
        SortButtonComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './watchlist-section.component.html',
    styleUrl: './watchlist-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistSectionComponent {
    readonly vm$ = this.store.userWatchlistVm$;
    readonly tabs = WATCHLIST_TABS;
    readonly sortOptions = SORT_OPTIONS;
    selectedTab: WatchlistTab = 'movies';

    constructor(private readonly store: UserWatchlistStore) {}

    onTabChange(tab: unknown): void {
        this.selectedTab = tab as WatchlistTab;
    }

    onToggleSortDirection(): void {
        this.store.changeSortDirection$().subscribe();
    }

    onShowMore(): void {
        if (this.selectedTab === 'movies') {
            this.store.loadMoreMovies$().subscribe();
        } else {
            this.store.loadMoreTv$().subscribe();
        }
    }
}
