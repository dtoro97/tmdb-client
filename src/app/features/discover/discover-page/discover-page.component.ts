import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    PageScrollService,
    PillToggleComponent,
    RepeatPipe,
    SkeletonComponent,
    SortButtonComponent,
} from '../../../shared';
import {
    DiscoverActiveFilter,
    DiscoverStoreService,
} from '../discover-store.service';
import { DiscoverCardComponent } from '../discover-card/discover-card.component';
import { DiscoverFilterPanelComponent } from '../discover-filter-panel/discover-filter-panel.component';

@Component({
    selector: 'app-discover-page',
    imports: [
        A11yModule,
        AsyncPipe,
        BrowseToolbarComponent,
        DiscoverCardComponent,
        DiscoverFilterPanelComponent,
        EmptyStateComponent,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        NgTemplateOutlet,
        PillToggleComponent,
        RepeatPipe,
        SkeletonComponent,
        SortButtonComponent,
    ],
    providers: [DiscoverStoreService],
    templateUrl: './discover-page.component.html',
    styleUrl: './discover-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverPageComponent {
    readonly vm$ = this.store.vm$;
    mobileFiltersOpen = false;

    constructor(
        private readonly pageScroll: PageScrollService,
        private readonly store: DiscoverStoreService,
    ) {}

    onMediaTypeChange(value: unknown): void {
        this.store.updateMediaType(value);
    }

    onSortChange(value: unknown): void {
        this.store.updateSort(value);
    }

    onSortDirectionToggle(): void {
        this.store.toggleSortDirection();
    }

    onGenresChange(value: unknown): void {
        this.store.updateGenres(value);
    }

    onKeywordSearchChange(value: string): void {
        this.store.updateKeywordSearch(value);
    }

    onKeywordAdd(value: unknown): void {
        this.store.addKeyword(value);
    }

    onCompanySearchChange(value: string): void {
        this.store.updateCompanySearch(value);
    }

    onCompanyAdd(value: unknown): void {
        this.store.addCompany(value);
    }

    onYearFromChange(value: unknown): void {
        this.store.updateYearFrom(value);
    }

    onYearToChange(value: unknown): void {
        this.store.updateYearTo(value);
    }

    onProvidersChange(value: unknown): void {
        this.store.updateProviders(value);
    }

    onWatchRegionChange(value: unknown): void {
        this.store.updateWatchRegion(value);
    }

    onCertificationChange(value: unknown): void {
        this.store.updateCertification(value);
    }

    onReleaseTypeChange(value: unknown): void {
        this.store.updateReleaseType(value);
    }

    onOriginalLanguageChange(value: unknown): void {
        this.store.updateOriginalLanguage(value);
    }

    onRatingChange(value: unknown): void {
        this.store.updateRating(value);
    }

    onVoteCountChange(value: unknown): void {
        this.store.updateVoteCount(value);
    }

    onRuntimeChange(value: unknown): void {
        this.store.updateRuntime(value);
    }

    clearFilter(filter: DiscoverActiveFilter): void {
        this.store.clearFilter(filter);
    }

    reset(): void {
        this.store.reset();
    }

    openFilters(): void {
        this.mobileFiltersOpen = true;
    }

    closeFilters(): void {
        this.mobileFiltersOpen = false;
    }

    onPageChange(event: PageEvent): void {
        this.pageScroll.scrollToTop();
        this.store.updatePage(event.pageIndex);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeFilters();
    }
}
