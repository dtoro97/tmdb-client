import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    ViewChild,
} from '@angular/core';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import type { MediaType, SelectOption } from '../../../shared';
import { StepperInputComponent } from '../../../shared/ui';

export const US_CERTIFICATIONS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

export interface WatchProviderOption {
    readonly id: number;
    readonly name: string;
}

export interface GenreOption {
    id: number;
    name: string;
}

export interface KeywordChip {
    id: number;
    name: string;
}

type LanguageOption = SelectOption<string>;

@Component({
    selector: 'app-discover-filters',
    templateUrl: './discover-filters.component.html',
    styleUrl: './discover-filters.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CdkAccordionModule,
        FormsModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSliderModule,
        NgxMatSelectSearchModule,
        StepperInputComponent,
    ],
})
export class DiscoverFiltersComponent implements OnChanges {
    @Input() genres: GenreOption[] = [];
    @Input() selectedGenreIds: number[] = [];
    @Input() keywords: KeywordChip[] = [];
    @Input() keywordSuggestions: KeywordChip[] = [];
    @Input() yearFrom: number | null = null;
    @Input() yearTo: number | null = null;
    @Input() minRating: number | null = null;
    @Input() mediaType: MediaType = 'movie';
    @Input() activeFilterCount = 0;
    @Input() voteCountMin: number | null = null;
    @Input() ratingPlaceholder: number | null = null;
    @Input() runtimeMin: number | null = null;
    @Input() runtimeMax: number | null = null;
    @Input() certifications: string[] = [];
    @Input() originalLanguage: string | null = null;
    @Input() watchProviderIds: number[] = [];
    @Input() watchProviderOptions!: readonly WatchProviderOption[];
    @Input() languageOptions: readonly LanguageOption[] = [];

    @Output() genreToggled = new EventEmitter<number>();
    @Output() keywordAdded = new EventEmitter<KeywordChip>();
    @Output() keywordRemoved = new EventEmitter<number>();
    @Output() keywordSearchChanged = new EventEmitter<string>();
    @Output() yearFromChanged = new EventEmitter<number | null>();
    @Output() yearToChanged = new EventEmitter<number | null>();
    @Output() minRatingChanged = new EventEmitter<number | null>();
    @Output() filtersCleared = new EventEmitter<void>();
    @Output() voteCountChanged = new EventEmitter<number | null>();
    @Output() runtimeMinChanged = new EventEmitter<number | null>();
    @Output() runtimeMaxChanged = new EventEmitter<number | null>();
    @Output() certificationToggled = new EventEmitter<string>();
    @Output() languageChanged = new EventEmitter<string | null>();
    @Output() watchProviderToggled = new EventEmitter<number>();

    keywordSearchText = '';

    @Input() certificationOptions: string[] = US_CERTIFICATIONS;

    mobileCollapsed = true;
    filteredLanguageOptions: readonly LanguageOption[] = [];
    private languageFilter = '';

    @ViewChild('keywordInput')
    private readonly keywordInput?: ElementRef<HTMLInputElement>;

    ngOnChanges(): void {
        this.filteredLanguageOptions = this.filterLanguageOptions();
    }

    onGenreToggle(genreId: number): void {
        this.genreToggled.emit(genreId);
    }

    onKeywordSelected(keyword: KeywordChip): void {
        this.keywordAdded.emit(keyword);
        this.keywordSearchText = '';
        if (this.keywordInput) {
            this.keywordInput.nativeElement.value = '';
        }
        this.keywordSearchChanged.emit('');
    }

    onKeywordRemove(keywordId: number): void {
        this.keywordRemoved.emit(keywordId);
    }

    onKeywordSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.keywordSearchText = value;
        this.keywordSearchChanged.emit(value);
    }

    onKeywordInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && this.keywordSuggestions.length > 0) {
            event.preventDefault();
            this.onKeywordSelected(this.keywordSuggestions[0]);
        }
    }

    onRatingChange(value: number): void {
        this.minRatingChanged.emit(value > 0 ? value : null);
    }

    formatRatingLabel(value: number): string {
        return value.toFixed(1);
    }

    onClearFilters(event?: Event): void {
        event?.stopPropagation();
        this.filtersCleared.emit();
    }

    onCertificationToggle(cert: string): void {
        this.certificationToggled.emit(cert);
    }

    onLanguageChange(value: string | null): void {
        this.languageChanged.emit(value || null);
    }

    updateLanguageFilter(filter: string): void {
        this.languageFilter = filter;
        this.filteredLanguageOptions = this.filterLanguageOptions();
    }

    onWatchProviderToggle(providerId: number): void {
        this.watchProviderToggled.emit(providerId);
    }

    private filterLanguageOptions(): readonly LanguageOption[] {
        if (!this.languageFilter) {
            return this.languageOptions;
        }

        const normalizedFilter = this.languageFilter.toLowerCase();
        return this.languageOptions.filter(
            (option) =>
                option.label.toLowerCase().includes(normalizedFilter) ||
                option.value.toLowerCase().includes(normalizedFilter),
        );
    }
}
