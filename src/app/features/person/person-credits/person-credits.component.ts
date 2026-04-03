import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
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
export class PersonCreditsComponent {
    readonly defaultExpandedCount = 3;

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

    onSectionChange(value: unknown): void {
        this.sectionChange.emit(value as PersonCreditsSection);
    }

    onMediaTypeChange(value: unknown): void {
        this.mediaTypeChange.emit(value as PersonCreditsMediaType);
    }

    onSortByChange(value: unknown): void {
        this.sortByChange.emit(value as PersonCreditsSortBy);
    }
}
