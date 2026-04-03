import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
} from '@angular/core';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    ImageComponent,
    LoadableValue,
    PillToggleComponent,
    RatingComponent,
    RepeatPipe,
    SkeletonComponent,
    SortButtonComponent,
    SortDirection,
} from '../../../shared';
import {
    PersonCreditsDisplayVm,
    PersonCreditsMediaType,
    PersonCreditsSection,
    PersonCreditsSortBy,
} from '../person-detail-store.service';

const DEFAULT_CREDITS_UI = {
    section: 'all' as PersonCreditsSection,
    mediaType: 'all' as PersonCreditsMediaType,
    sortBy: 'date' as PersonCreditsSortBy,
    sortDirection: 'desc' as SortDirection,
};

@Component({
    selector: 'app-person-credits',
    imports: [
        CdkAccordionModule,
        MatChipsModule,
        MatDividerModule,
        RouterLink,
        PillToggleComponent,
        SortButtonComponent,
        SkeletonComponent,
        EmptyStateComponent,
        ImageComponent,
        RatingComponent,
        RepeatPipe,
        BrowseToolbarComponent,
    ],
    templateUrl: './person-credits.component.html',
    styleUrl: './person-credits.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCreditsComponent implements OnChanges {
    readonly defaultExpandedCount = 3;
    summaryText = '';
    hasActiveFilters = false;
    emptyStateTitle = 'No filmography available yet';
    emptyStateText = 'We do not have any film or TV credits to show right now.';

    @Input({ required: true }) state: LoadableValue<PersonCreditsDisplayVm> = {
        type: 'idle',
    };
    @Input() section: PersonCreditsSection = 'all';
    @Input() mediaType: PersonCreditsMediaType = 'all';
    @Input() sortBy: PersonCreditsSortBy = 'date';
    @Input() sortDirection: SortDirection = 'desc';

    @Output() sectionChange = new EventEmitter<PersonCreditsSection>();
    @Output() mediaTypeChange = new EventEmitter<PersonCreditsMediaType>();
    @Output() sortByChange = new EventEmitter<PersonCreditsSortBy>();
    @Output() sortDirectionToggle = new EventEmitter<void>();
    @Output() resetFilters = new EventEmitter<void>();

    readonly sectionOptions: { label: string; value: PersonCreditsSection }[] =
        [
            { label: 'All', value: 'all' },
            { label: 'Cast', value: 'cast' },
            { label: 'Production', value: 'production' },
        ];

    readonly mediaOptions: { label: string; value: PersonCreditsMediaType }[] =
        [
            { label: 'All media', value: 'all' },
            { label: 'Movies', value: 'movie' },
            { label: 'TV Series', value: 'tv' },
        ];

    readonly sortOptions: { label: string; value: PersonCreditsSortBy }[] = [
        { label: 'Release date', value: 'date' },
        { label: 'Rating', value: 'rating' },
        { label: 'Title', value: 'title' },
    ];

    ngOnChanges(): void {
        this.hasActiveFilters =
            this.section !== DEFAULT_CREDITS_UI.section ||
            this.mediaType !== DEFAULT_CREDITS_UI.mediaType ||
            this.sortBy !== DEFAULT_CREDITS_UI.sortBy ||
            this.sortDirection !== DEFAULT_CREDITS_UI.sortDirection;

        this.summaryText = buildCreditsSummary(
            this.state,
            this.section,
            this.mediaType,
            this.sortBy,
            this.sortDirection,
        );

        this.emptyStateTitle = this.hasActiveFilters
            ? 'No filmography matches these filters'
            : 'No filmography available yet';
        this.emptyStateText = this.hasActiveFilters
            ? 'Try resetting the filters to bring back more titles.'
            : 'We do not have any film or TV credits to show right now.';
    }

    onSectionChange(value: unknown): void {
        this.sectionChange.emit(value as PersonCreditsSection);
    }

    onMediaTypeChange(value: unknown): void {
        this.mediaTypeChange.emit(value as PersonCreditsMediaType);
    }

    onSortByChange(value: unknown): void {
        this.sortByChange.emit(value as PersonCreditsSortBy);
    }

    onResetFilters(): void {
        this.resetFilters.emit();
    }
}

const buildCreditsSummary = (
    state: LoadableValue<PersonCreditsDisplayVm>,
    section: PersonCreditsSection,
    mediaType: PersonCreditsMediaType,
    sortBy: PersonCreditsSortBy,
    sortDirection: SortDirection,
): string => {
    if (state.type !== 'loaded' || !state.value.totalCount) {
        return '';
    }

    const count = state.value.totalCount;
    const creditsLabel =
        section === 'cast'
            ? 'acting credits'
            : section === 'production'
              ? 'production credits'
              : 'credits';
    const mediaLabel =
        mediaType === 'movie'
            ? 'in movies'
            : mediaType === 'tv'
              ? 'in TV series'
              : 'across film and TV';
    const organizationLabel =
        sortBy === 'date'
            ? 'grouped by year'
            : sortBy === 'rating'
              ? `sorted by rating (${sortDirection === 'desc' ? 'highest first' : 'lowest first'})`
              : `sorted alphabetically (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`;

    return `${count} ${creditsLabel} ${mediaLabel}, ${organizationLabel}.`;
};
