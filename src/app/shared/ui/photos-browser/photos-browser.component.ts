import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { BehaviorSubject, combineLatest, map } from 'rxjs';

import { ImagePipe } from '../../pipes';
import { ViewerImage } from '../photo-viewer/photo-viewer.component';
import { PillToggleComponent } from '../pill-toggle/pill-toggle.component';
import { SortButtonComponent } from '../sort-button/sort-button.component';

type SortField = 'rating' | 'votes' | 'resolution';
type SortDirection = 'asc' | 'desc';

export interface PhotosBrowserSelection {
    images: ViewerImage[];
    index: number;
}

@Component({
    selector: 'app-photos-browser',
    imports: [
        AsyncPipe,
        MatButtonModule,
        ImagePipe,
        PillToggleComponent,
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
    ];

    private readonly imagesSubject = new BehaviorSubject<ViewerImage[]>([]);
    private readonly selectedTypesSubject = new BehaviorSubject<string[]>([]);
    private readonly visibleCountSubject = new BehaviorSubject<number>(18);
    private readonly sortFieldSubject = new BehaviorSubject<SortField>('rating');
    private readonly sortDirectionSubject = new BehaviorSubject<SortDirection>(
        'desc',
    );

    @Input() emptyText = 'No photos found.';
    @Input() initialCount = 18;
    @Input() incrementCount = 18;
    @Input() set images(value: ViewerImage[] | null) {
        this.imagesSubject.next(value ?? []);
        this.visibleCountSubject.next(this.initialCount);
        this.selectedTypesSubject.next([]);
    }

    @Output() photoSelect = new EventEmitter<PhotosBrowserSelection>();

    readonly sortField$ = this.sortFieldSubject.asObservable();
    readonly sortDirection$ = this.sortDirectionSubject.asObservable();
    readonly selectedTypes$ = this.selectedTypesSubject.asObservable();

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

    readonly filteredSortedImages$ = combineLatest([
        this.imagesSubject,
        this.selectedTypes$,
        this.sortField$,
        this.sortDirection$,
    ]).pipe(
        map(([images, selectedTypes, sortField, sortDirection]) => {
            const filtered = selectedTypes.length
                ? images.filter((image) =>
                      selectedTypes.includes(image.photoType ?? ''),
                  )
                : images;

            const sorted = [...filtered].sort((a, b) => {
                const aValue = this.getSortValue(a, sortField);
                const bValue = this.getSortValue(b, sortField);
                return aValue - bValue;
            });

            return sortDirection === 'desc' ? sorted.reverse() : sorted;
        }),
    );

    readonly visibleImages$ = combineLatest([
        this.filteredSortedImages$,
        this.visibleCountSubject,
    ]).pipe(map(([images, visibleCount]) => images.slice(0, visibleCount)));

    readonly hasMore$ = combineLatest([
        this.filteredSortedImages$,
        this.visibleImages$,
    ]).pipe(map(([all, visible]) => all.length > visible.length));

    readonly visibleCountLabel$ = combineLatest([
        this.visibleImages$,
        this.filteredSortedImages$,
    ]).pipe(
        map(
            ([visible, total]) =>
                `${visible.length ? 1 : 0}-${visible.length} of ${total.length}`,
        ),
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
        return image.vote_average ?? 0;
    }
}
