import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import {
    ToggleGroupComponent,
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
        ToggleGroupComponent,
        StepperInputComponent,
    ],
    templateUrl: './discover-filter-panel.component.html',
    styleUrl: './discover-filter-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverFilterPanelComponent {
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
    readonly certificationOptions = input<readonly SelectOption<string>[]>([]);
    @Input() selectedCertification: string | null = null;
    @Input() releaseTypeOptions: SelectOption<DiscoverMovieReleaseType | null>[] = [];
    @Input() selectedReleaseType: DiscoverMovieReleaseType | null = null;
    readonly languageOptions = input<readonly SelectOption<string>[]>([]);
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
    readonly certificationToggleOptions = computed<SelectOption<string | null>[]>(() => [
        { label: 'Any certification', value: null },
        ...this.certificationOptions(),
    ]);
    readonly filteredLanguageOptions = computed(() => this.filterLanguageOptions());
    private readonly languageFilter = signal('');

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

    updateLanguageFilter(filter: string | null): void {
        this.languageFilter.set(filter ?? '');
    }

    private filterLanguageOptions(): SelectOption<string>[] {
        const languageFilter = this.languageFilter();

        if (!languageFilter) {
            return [...this.languageOptions()];
        }

        const normalizedFilter = languageFilter.toLowerCase();
        return this.languageOptions().filter(
            (option) =>
                option.label.toLowerCase().includes(normalizedFilter) ||
                option.value.toLowerCase().includes(normalizedFilter),
        );
    }
}
