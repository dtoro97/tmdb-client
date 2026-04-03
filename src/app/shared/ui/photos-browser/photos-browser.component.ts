import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { BehaviorSubject, combineLatest, map } from 'rxjs';

import type { ConfigurationImages } from '../../../api';
import { ImagePipe } from '../../pipes';
import { PHOTOS_BROWSER_BATCH } from '../../../constants';
import type { SortDirection } from '../../utils';
import type { PhotosBrowserSelection, ViewerImage } from '../../models';
import { ConfigStoreService } from '../../services/config-store.service';
import { LocaleStoreService } from '../../services/locale-store.service';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { BrowseToolbarComponent } from '../browse-toolbar/browse-toolbar.component';
import { PillToggleComponent } from '../pill-toggle/pill-toggle.component';
import { RatingComponent } from '../rating/rating.component';
import { SortButtonComponent } from '../sort-button/sort-button.component';

type SortField = 'rating' | 'votes' | 'resolution' | 'language';

interface PhotosBrowserCard {
    image: ViewerImage;
    thumbnailSize: string;
}

const pickConfiguredImageSize = (
    sizes: readonly string[] | undefined,
    preferredSizes: readonly string[],
    fallbackSize: string,
): string => {
    for (const size of preferredSizes) {
        if (sizes?.includes(size)) {
            return size;
        }
    }

    const largestConfiguredSize = [...(sizes ?? [])]
        .reverse()
        .find((size) => size !== 'original');

    return largestConfiguredSize ?? fallbackSize;
};

@Component({
    selector: 'app-photos-browser',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        MatButtonModule,
        MatSelectModule,
        EmptyStateComponent,
        ImagePipe,
        PillToggleComponent,
        RatingComponent,
        SortButtonComponent,
    ],
    templateUrl: './photos-browser.component.html',
    styleUrl: './photos-browser.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotosBrowserComponent {
    readonly sortOptions = [
        { label: 'Rating', value: 'rating' as const },
        { label: 'Votes', value: 'votes' as const },
        { label: 'Resolution', value: 'resolution' as const },
        { label: 'Language', value: 'language' as const },
    ];

    private readonly imagesSubject = new BehaviorSubject<ViewerImage[]>([]);
    private readonly selectedTypesSubject = new BehaviorSubject<string[]>([]);
    private readonly selectedLanguagesSubject = new BehaviorSubject<string[]>(
        [],
    );
    private readonly visibleCountSubject = new BehaviorSubject<number>(
        PHOTOS_BROWSER_BATCH,
    );
    private readonly sortFieldSubject = new BehaviorSubject<SortField>(
        'rating',
    );
    private readonly sortDirectionSubject = new BehaviorSubject<SortDirection>(
        'desc',
    );
    private readonly userLanguage = this.localeStore.language();

    constructor(
        private readonly configStoreService: ConfigStoreService,
        private readonly localeStore: LocaleStoreService,
    ) {}

    @Input() initialCount = PHOTOS_BROWSER_BATCH;
    @Input() incrementCount = PHOTOS_BROWSER_BATCH;
    @Input() set images(value: ViewerImage[] | null) {
        const images = value ?? [];
        this.imagesSubject.next(images);
        this.visibleCountSubject.next(this.initialCount);
        this.selectedTypesSubject.next([]);

        const appLanguage = this.localeStore.language();
        const hasAppLanguage = images.some(
            (image) => image.iso_639_1 === appLanguage,
        );
        this.selectedLanguagesSubject.next(
            hasAppLanguage ? [appLanguage] : [],
        );
    }

    @Output() photoSelect = new EventEmitter<PhotosBrowserSelection>();

    readonly sortField$ = this.sortFieldSubject.asObservable();
    readonly sortDirection$ = this.sortDirectionSubject.asObservable();
    readonly selectedTypes$ = this.selectedTypesSubject.asObservable();
    readonly selectedLanguages$ = this.selectedLanguagesSubject.asObservable();

    readonly hasImages$ = this.imagesSubject.pipe(
        map((images) => images.length > 0),
    );

    readonly typePillOptions$ = this.imagesSubject.pipe(
        map((images) => {
            const uniqueTypes = new Set(
                images
                    .map((image) => image.photoType)
                    .filter((type): type is string => !!type),
            );
            return [...uniqueTypes]
                .sort((a, b) => a.localeCompare(b))
                .map((type) => ({
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    value: type,
                }));
        }),
    );

    readonly languageOptions$ = combineLatest([
        this.imagesSubject,
        this.configStoreService.languages$,
    ]).pipe(
        map(([images, languages]) => {
            const uniqueLanguages = new Set(
                images
                    .map((image) => image.iso_639_1)
                    .filter((language): language is string => !!language),
            );

            const languageLookup = new Map(
                languages
                    .filter((language) => !!language.iso_639_1)
                    .map((language) => [
                        language.iso_639_1 as string,
                        language.english_name || language.name || '',
                    ]),
            );

            return [...uniqueLanguages]
                .sort((a, b) =>
                    this.getLanguageLabel(a, languageLookup).localeCompare(
                        this.getLanguageLabel(b, languageLookup),
                    ),
                )
                .map((language) => ({
                    label: this.getLanguageLabel(language, languageLookup),
                    value: language,
                }));
        }),
    );

    readonly filteredSortedImages$ = combineLatest([
        this.imagesSubject,
        this.configStoreService.languages$,
        this.selectedTypes$,
        this.selectedLanguages$,
        this.sortField$,
        this.sortDirection$,
    ]).pipe(
        map(
            ([
                images,
                languages,
                selectedTypes,
                selectedLanguages,
                sortField,
                sortDirection,
            ]) => {
                const languageLookup = new Map(
                    languages
                        .filter((language) => !!language.iso_639_1)
                        .map((language) => [
                            language.iso_639_1 as string,
                            language.english_name || language.name || '',
                        ]),
                );
                let filtered = selectedTypes.length
                    ? images.filter((image) =>
                          selectedTypes.includes(image.photoType ?? ''),
                      )
                    : images;

                if (selectedLanguages.length) {
                    filtered = filtered.filter((image) =>
                        selectedLanguages.includes(image.iso_639_1 ?? ''),
                    );
                }

                const sorted = [...filtered].sort((a, b) => {
                    const aValue = this.getSortValue(a, sortField);
                    const bValue = this.getSortValue(b, sortField);

                    if (aValue !== bValue) {
                        return aValue - bValue;
                    }

                    if (sortField === 'language') {
                        return this.getLanguageLabel(
                            a.iso_639_1,
                            languageLookup,
                        ).localeCompare(
                            this.getLanguageLabel(b.iso_639_1, languageLookup),
                        );
                    }

                    return 0;
                });

                return sortDirection === 'desc' ? sorted.reverse() : sorted;
            },
        ),
    );

    readonly visibleImages$ = combineLatest([
        this.filteredSortedImages$,
        this.visibleCountSubject,
    ]).pipe(map(([images, visibleCount]) => images.slice(0, visibleCount)));

    readonly visibleCards$ = combineLatest([
        this.visibleImages$,
        this.configStoreService.configuration$.pipe(
            map(
                (configuration) =>
                    (
                        configuration as unknown as {
                            images?: ConfigurationImages;
                        }
                    ).images,
            ),
        ),
    ]).pipe(
        map(([images, configImages]): PhotosBrowserCard[] =>
            images.map((image) => ({
                image,
                thumbnailSize: this.getThumbnailSize(image, configImages),
            })),
        ),
    );

    readonly visibleBrowserVm$ = combineLatest([
        this.visibleImages$,
        this.visibleCards$,
    ]).pipe(
        map(([images, cards]) => ({
            images,
            cards,
        })),
    );

    readonly hasMore$ = combineLatest([
        this.filteredSortedImages$,
        this.visibleImages$,
    ]).pipe(map(([all, visible]) => all.length > visible.length));

    readonly visibleCountLabel$ = combineLatest([
        this.visibleImages$,
        this.filteredSortedImages$,
    ]).pipe(
        map(([visible, total]) =>
            total.length > 0
                ? `${visible.length ? 1 : 0} - ${visible.length} of ${total.length}`
                : undefined,
        ),
    );

    readonly selectedLanguageLabel$ = combineLatest([
        this.selectedLanguages$,
        this.languageOptions$,
    ]).pipe(
        map(([selectedLanguages, options]) => {
            if (!selectedLanguages.length) {
                return 'Languages';
            }

            const selectedLookup = new Map(
                options.map((option) => [option.value as string, option.label]),
            );

            return selectedLanguages
                .map((language) => selectedLookup.get(language) ?? language)
                .join(', ');
        }),
    );

    readonly hasSelectedLanguages$ = this.selectedLanguages$.pipe(
        map((languages) => languages.length > 0),
    );

    setSortField(value: unknown): void {
        this.sortFieldSubject.next(value as SortField);
    }

    toggleSortDirection(): void {
        this.sortDirectionSubject.next(
            this.sortDirectionSubject.value === 'asc' ? 'desc' : 'asc',
        );
    }

    setSelectedTypes(value: unknown): void {
        this.selectedTypesSubject.next((value as string[]) ?? []);
        this.visibleCountSubject.next(this.initialCount);
    }

    setSelectedLanguages(value: unknown): void {
        this.selectedLanguagesSubject.next((value as string[]) ?? []);
        this.visibleCountSubject.next(this.initialCount);
    }

    showMore(): void {
        this.visibleCountSubject.next(
            this.visibleCountSubject.value + this.incrementCount,
        );
    }

    onImageClick(index: number, images: ViewerImage[]): void {
        this.photoSelect.emit({ images, index });
    }
    private getSortValue(image: ViewerImage, sortField: SortField): number {
        if (sortField === 'votes') {
            return image.vote_count ?? 0;
        }
        if (sortField === 'resolution') {
            return (image.width ?? 0) * (image.height ?? 0);
        }
        if (sortField === 'language') {
            const language = image.iso_639_1;

            if (!language) {
                return 0;
            }

            if (language === this.userLanguage) {
                return 2;
            }

            return 1;
        }
        return image.vote_average ?? 0;
    }

    private getLanguageLabel(
        languageCode: string | null | undefined,
        languageLookup: ReadonlyMap<string, string>,
    ): string {
        if (!languageCode) {
            return '';
        }

        return languageLookup.get(languageCode) || languageCode.toUpperCase();
    }

    private getThumbnailSize(
        image: ViewerImage,
        configImages: ConfigurationImages | undefined,
    ): string {
        if (image.photoType === 'poster') {
            return pickConfiguredImageSize(
                configImages?.poster_sizes,
                ['w342', 'w300', 'w185'],
                'w342',
            );
        }

        if (image.photoType === 'profile') {
            return pickConfiguredImageSize(
                configImages?.profile_sizes,
                ['h632', 'w185', 'w45'],
                'w185',
            );
        }

        if (image.photoType === 'tagged') {
            return pickConfiguredImageSize(
                configImages?.still_sizes ?? configImages?.backdrop_sizes,
                ['w300', 'w185'],
                'w300',
            );
        }

        return pickConfiguredImageSize(
            configImages?.backdrop_sizes ?? configImages?.still_sizes,
            ['w500', 'w300'],
            'w500',
        );
    }
}
