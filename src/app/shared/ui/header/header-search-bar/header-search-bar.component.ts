import { debounceTime, map, Observable, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { RatingComponent } from '../../rating/rating.component';
import { MediaThumbComponent } from '../../media-thumb/media-thumb.component';
import { SearchRestControllerService } from '../../../../api';
import { CdkTrapFocus } from '@angular/cdk/a11y';

interface DisplayResult {
    id: number;
    thumb: string | null;
    title: string;
    year: string;
    mediaType: string;
    overview: string;
    rating: number | null;
    department: string;
}

@Component({
    selector: 'app-header-search-bar',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
        RatingComponent,
        MediaThumbComponent,
        CdkTrapFocus,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header-search-bar.component.html',
    styleUrl: './header-search-bar.component.scss',
})
export class HeaderSearchBarComponent {
    searchControl = new FormControl('');

    searchOpen = false;
    searchFilter: 'all' | 'movie' | 'tv' | 'person' = 'all';
    filterOptions: {
        label: string;
        value: 'all' | 'movie' | 'tv' | 'person';
    }[] = [
        { label: 'All', value: 'all' },
        { label: 'Movies', value: 'movie' },
        { label: 'TV Shows', value: 'tv' },
        { label: 'People', value: 'person' },
    ];
    searchResults: DisplayResult[] = [];
    showSearchDropdown = false;

    private _search = new Subject<string>();

    constructor(
        private searchService: SearchRestControllerService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private el: ElementRef,
    ) {
        this._search
            .pipe(
                takeUntilDestroyed(),
                debounceTime(500),
                switchMap((query) => this.getSearchObservable(query)),
            )
            .subscribe((results) => {
                this.searchResults = results;
                this.showSearchDropdown = results.length > 0;
                this.cdr.markForCheck();
            });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.showSearchDropdown = false;
            this.cdr.markForCheck();
        }
    }

    onSearchFocus() {
        if (this.searchResults.length > 0) {
            this.showSearchDropdown = true;
        }
    }

    closeSearch() {
        this.searchControl.setValue('');
        this.showSearchDropdown = false;
        this.searchOpen = false;
        this.searchResults = [];
    }

    setFilter(filter: 'all' | 'movie' | 'tv' | 'person') {
        this.searchFilter = filter;
        if (this.searchControl.value) {
            this._search.next(this.searchControl.value);
        }
    }

    search(term: string | null) {
        if (term) {
            this._search.next(term);
        } else {
            this.searchResults = [];
            this.showSearchDropdown = false;
        }
    }

    navigateToResult(item: DisplayResult) {
        this.searchControl.setValue('', { emitEvent: false });
        this.showSearchDropdown = false;
        this.searchResults = [];
        this.searchOpen = false;
        if (item.mediaType === 'person') {
            this.router.navigate(['name', item.id]);
        } else {
            this.router.navigate(['title', item.id, item.mediaType]);
        }
    }

    private getSearchObservable(query: string): Observable<DisplayResult[]> {
        const opts = { httpHeaderAccept: 'application/json' as const };
        switch (this.searchFilter) {
            case 'movie':
                return this.searchService
                    .searchMovie(
                        query,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        opts,
                    )
                    .pipe(
                        map((p) =>
                            (p.results || []).map((m) => ({
                                id: m.id!,
                                thumb: m.poster_path || null,
                                title: m.title || '',
                                year: (m.release_date || '').substring(0, 4),
                                mediaType: 'movie',
                                overview: m.overview || '',
                                rating: m.vote_average ?? null,
                                department: '',
                            })),
                        ),
                    );
            case 'tv':
                return this.searchService
                    .searchTv(
                        query,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        opts,
                    )
                    .pipe(
                        map((p) =>
                            (p.results || []).map((s) => ({
                                id: s.id!,
                                thumb: s.poster_path || null,
                                title: s.name || '',
                                year: (s.first_air_date || '').substring(0, 4),
                                mediaType: 'tv',
                                overview: s.overview || '',
                                rating: s.vote_average ?? null,
                                department: '',
                            })),
                        ),
                    );
            case 'person':
                return this.searchService
                    .searchPerson(
                        query,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        opts,
                    )
                    .pipe(
                        map((p) =>
                            (p.results || []).map((person) => ({
                                id: person.id!,
                                thumb: (person as any).profile_path || null,
                                title: person.name || '',
                                year: '',
                                mediaType: 'person',
                                overview: '',
                                rating: null,
                                department:
                                    (person as any).known_for_department || '',
                            })),
                        ),
                    );
            default:
                return this.searchService
                    .searchMulti(
                        query,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        opts,
                    )
                    .pipe(
                        map((p) =>
                            (p.results || []).map((m) => ({
                                id: m.id!,
                                thumb: m.poster_path || m.profile_path || null,
                                title: m.title || m.name || '',
                                year: (
                                    m.release_date ||
                                    m.first_air_date ||
                                    ''
                                ).substring(0, 4),
                                mediaType: m.media_type || 'movie',
                                overview: m.overview || '',
                                rating: m.vote_average ?? null,
                                department: m.known_for_department || '',
                            })),
                        ),
                    );
        }
    }
}
