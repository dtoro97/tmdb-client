import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { combineLatest, map, switchMap, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { PAGE_SIZE, SMALL_LIST_COUNT } from '../../../constants';
import {
    EmptyStateComponent,
    MediaListComponent,
    PillToggleComponent,
    PersonListComponent,
} from '../../../shared';
import { GenreService } from '../../../shared/services';
import { SearchStoreService, SearchType } from '../search-store.service';

@Component({
    selector: 'app-search-page',
    templateUrl: './search-page.component.html',
    styleUrl: './search-page.component.scss',
    imports: [
        AsyncPipe,
        MatButtonModule,
        EmptyStateComponent,
        MediaListComponent,
        PillToggleComponent,
        PersonListComponent,
    ],
    providers: [SearchStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {
    readonly typeOptions = [
        { label: 'All', value: 'all' },
        { label: 'Movies', value: 'movie' },
        { label: 'TV Series', value: 'tv' },
        { label: 'People', value: 'person' },
    ] satisfies { label: string; value: SearchType }[];

    readonly vm$ = combineLatest({
        query: this.store.query$,
        type: this.store.type$,
        movieState: this.store.movieResultsState$,
        tvState: this.store.tvResultsState$,
        personState: this.store.personResultsState$,
        movieHasMore: this.store.movieHasMore$,
        tvHasMore: this.store.tvHasMore$,
        personHasMore: this.store.personHasMore$,
        noSearchResults: this.store.noSearchResults$,
        movieGenreMap: this.genreService.movieGenres$,
        tvGenreMap: this.genreService.tvGenres$,
    }).pipe(
        map((vm) => ({
            ...vm,
            listSkeletonCount: vm.type === 'all' ? SMALL_LIST_COUNT : PAGE_SIZE,
        })),
    );

    constructor(
        private readonly store: SearchStoreService,
        private readonly route: ActivatedRoute,
        private readonly titleService: Title,
        private readonly genreService: GenreService,
    ) {
        this.route.queryParamMap
            .pipe(
                switchMap((params) => {
                    const query = params.get('query') ?? '';
                    const type = this.normalizeType(params.get('type'));
                    return this.store.search$(query, type);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.query$
            .pipe(
                tap((query) => {
                    this.titleService.setTitle(
                        query ? `Results for "${query}"` : 'Search',
                    );
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    loadMoreMovies(): void {
        this.store.loadMoreMovies$().subscribe();
    }

    loadMoreTv(): void {
        this.store.loadMoreTv$().subscribe();
    }

    loadMorePeople(): void {
        this.store.loadMorePeople$().subscribe();
    }

    setType(type: unknown): void {
        this.store.updateType(type as SearchType);
    }

    private normalizeType(value: string | null): SearchType {
        if (value === 'movie' || value === 'tv' || value === 'person') {
            return value;
        }

        return 'all';
    }
}
