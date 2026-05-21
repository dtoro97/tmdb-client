import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    MediaListComponent,
    PillToggleComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { UserListsStore } from '../user-lists-store.service';

type FavoritesTab = 'movies' | 'tv';

const FAVORITES_TABS = [
    { label: 'Movies', value: 'movies' as const },
    { label: 'TV shows', value: 'tv' as const },
];

@Component({
    selector: 'app-favorites-section',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        EmptyStateComponent,
        MediaListComponent,
        PillToggleComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './favorites-section.component.html',
    styleUrl: './favorites-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesSectionComponent {
    readonly vm$ = this.store.vm$;
    readonly tabs = FAVORITES_TABS;
    selectedTab: FavoritesTab = 'movies';

    constructor(private readonly store: UserListsStore) {}

    onTabChange(tab: unknown): void {
        this.selectedTab = tab as FavoritesTab;
    }
}
