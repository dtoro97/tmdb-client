import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { PAGE_SIZE } from '../../../constants';
import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    MediaListComponent,
    PersonListComponent,
    PillToggleComponent,
    SortButtonComponent,
} from '../../../shared';
import {
    DiscoverFiltersComponent,
    KeywordChip,
} from '../discover-filters/discover-filters.component';
import { DiscoverStoreService } from '../discover-store.service';

@Component({
    selector: 'app-discover-page',
    templateUrl: './discover-page.component.html',
    styleUrl: './discover-page.component.scss',
    imports: [
        AsyncPipe,
        MatButtonModule,
        DiscoverFiltersComponent,
        EmptyStateComponent,
        MediaListComponent,
        PersonListComponent,
        PillToggleComponent,
        SortButtonComponent,
        BrowseToolbarComponent,
    ],
    providers: [DiscoverStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverPageComponent {
    readonly browseSkeletonCount = PAGE_SIZE;
    readonly vm$ = this.store.vm$;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly store: DiscoverStoreService,
    ) {
        this.route.queryParamMap
            .pipe(takeUntilDestroyed())
            .subscribe((params) => {
                this.store.applyQueryParams(params);
            });
    }

    loadMore(): void {
        this.store.loadMore();
    }

    onCategoryChange(category: unknown): void {
        this.store.setCategory(category as string);
    }

    onSortChange(sortField: unknown): void {
        this.store.setSort(sortField as string);
    }

    toggleSortDirection(): void {
        this.store.toggleSortDirection();
    }

    onGenreToggle(genreId: number): void {
        this.store.toggleGenre(genreId);
    }

    onKeywordSearch(query: string): void {
        this.store.searchKeywords(query);
    }

    onKeywordAdd(keyword: KeywordChip): void {
        this.store.addKeyword(keyword);
    }

    onKeywordRemove(keywordId: number): void {
        this.store.removeKeyword(keywordId);
    }

    onYearFromChange(value: number | null, yearTo: number | null): void {
        this.store.setYearRange(value, yearTo);
    }

    onYearToChange(value: number | null, yearFrom: number | null): void {
        this.store.setYearRange(yearFrom, value);
    }

    onMinRatingChange(value: number | null): void {
        this.store.setMinRating(value);
    }

    onClearFilters(): void {
        this.store.clearFilters();
    }

    onVoteCountChange(value: number | null): void {
        this.store.setVoteCount(value);
    }

    onRuntimeMinChange(value: number | null, runtimeMax: number | null): void {
        this.store.setRuntime(value, runtimeMax);
    }

    onRuntimeMaxChange(value: number | null, runtimeMin: number | null): void {
        this.store.setRuntime(runtimeMin, value);
    }

    onCertificationToggle(cert: string): void {
        this.store.toggleCertification(cert);
    }

    onLanguageChange(language: string | null): void {
        this.store.setLanguage(language);
    }

    onWatchProviderToggle(providerId: number): void {
        this.store.toggleWatchProvider(providerId);
    }
}
