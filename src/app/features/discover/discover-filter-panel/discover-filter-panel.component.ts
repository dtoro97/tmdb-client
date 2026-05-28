import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import {
    PillToggleComponent,
    SelectOption,
    StepperInputComponent,
} from '../../../shared';
import {
    DiscoverMovieReleaseType,
    DiscoverRuntimePreset,
} from '../discover-page-definitions';

@Component({
    selector: 'app-discover-filter-panel',
    imports: [
        MatButtonModule,
        FormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        NgxMatSelectSearchModule,
        PillToggleComponent,
        StepperInputComponent,
    ],
    templateUrl: './discover-filter-panel.component.html',
    styleUrl: './discover-filter-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverFilterPanelComponent implements OnChanges {
    @Input() showHeader = false;
    @Input() activeFilterCount = 0;
    @Input() showGenreFilter = false;
    @Input() showKeywordFilter = false;
    @Input() showCompanyFilter = false;
    @Input() showYearRangeFilter = false;
    @Input() showWatchRegionFilter = false;
    @Input() showProviderFilter = false;
    @Input() showCertificationFilter = false;
    @Input() showReleaseTypeFilter = false;
    @Input() showLanguageFilter = false;
    @Input() showRatingFilter = false;
    @Input() showVoteCountFilter = false;
    @Input() showRuntimeFilter = false;
    @Input() genreOptions: SelectOption<number>[] = [];
    @Input() selectedGenreIds: number[] = [];
    @Input() keywordSuggestions: SelectOption<number>[] = [];
    @Input() companySuggestions: SelectOption<number>[] = [];
    @Input() selectedYearFrom: number | null = null;
    @Input() selectedYearTo: number | null = null;
    @Input() watchRegionOptions: SelectOption<string>[] = [];
    @Input() watchRegion = '';
    @Input() providerOptions: SelectOption<number>[] = [];
    @Input() selectedProviderIds: number[] = [];
    @Input() certificationOptions: SelectOption<string>[] = [];
    @Input() selectedCertification: string | null = null;
    @Input() releaseTypeOptions: SelectOption<DiscoverMovieReleaseType | null>[] = [];
    @Input() selectedReleaseType: DiscoverMovieReleaseType | null = null;
    @Input() languageOptions: SelectOption<string>[] = [];
    @Input() selectedOriginalLanguage: string | null = null;
    @Input() ratingOptions: SelectOption<number | null>[] = [];
    @Input() selectedRating: number | null = null;
    @Input() voteCountOptions: SelectOption<number | null>[] = [];
    @Input() selectedVoteCount: number | null = null;
    @Input() runtimeOptions: SelectOption<DiscoverRuntimePreset>[] = [];
    @Input() selectedRuntime: DiscoverRuntimePreset = 'any';

    @Output() genresChange = new EventEmitter<unknown>();
    @Output() keywordSearchChange = new EventEmitter<string>();
    @Output() keywordAdd = new EventEmitter<unknown>();
    @Output() companySearchChange = new EventEmitter<string>();
    @Output() companyAdd = new EventEmitter<unknown>();
    @Output() yearFromChange = new EventEmitter<unknown>();
    @Output() yearToChange = new EventEmitter<unknown>();
    @Output() watchRegionChange = new EventEmitter<unknown>();
    @Output() providersChange = new EventEmitter<unknown>();
    @Output() certificationChange = new EventEmitter<unknown>();
    @Output() releaseTypeChange = new EventEmitter<unknown>();
    @Output() originalLanguageChange = new EventEmitter<unknown>();
    @Output() ratingChange = new EventEmitter<unknown>();
    @Output() voteCountChange = new EventEmitter<unknown>();
    @Output() runtimeChange = new EventEmitter<unknown>();
    @Output() resetFilters = new EventEmitter<void>();
    @Output() closePanel = new EventEmitter<void>();

    keywordSearchText = '';
    companySearchText = '';
    certificationPillOptions: SelectOption<string | null>[] = [];
    filteredLanguageOptions: SelectOption<string>[] = [];
    private languageFilter = '';

    ngOnChanges(): void {
        this.certificationPillOptions = [
            { label: 'Any certification', value: null },
            ...this.certificationOptions,
        ];
        this.filteredLanguageOptions = this.filterLanguageOptions();
    }

    onKeywordSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.keywordSearchText = value;
        this.keywordSearchChange.emit(value);
    }

    onKeywordAdd(value: unknown): void {
        this.keywordSearchText = '';
        this.keywordAdd.emit(value);
    }

    onCompanySearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.companySearchText = value;
        this.companySearchChange.emit(value);
    }

    onCompanyAdd(value: unknown): void {
        this.companySearchText = '';
        this.companyAdd.emit(value);
    }

    updateLanguageFilter(filter: string): void {
        this.languageFilter = filter;
        this.filteredLanguageOptions = this.filterLanguageOptions();
    }

    private filterLanguageOptions(): SelectOption<string>[] {
        if (!this.languageFilter) {
            return [...this.languageOptions];
        }

        const normalizedFilter = this.languageFilter.toLowerCase();
        return this.languageOptions.filter(
            (option) =>
                option.label.toLowerCase().includes(normalizedFilter) ||
                option.value.toLowerCase().includes(normalizedFilter),
        );
    }
}
