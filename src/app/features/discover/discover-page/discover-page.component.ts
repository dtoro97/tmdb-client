import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';

import { switchMap, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
    BrowseCategory,
    BrowseMediaType,
    DiscoverStoreService,
    DiscoverType,
    SortDirection,
} from '../discover-store.service';
import {
    MediaListItemComponent,
    PersonListItemComponent,
    SortButtonComponent,
    parseCsvParam,
} from '../../../shared';

@Component({
    selector: 'app-discover-page',
    templateUrl: './discover-page.component.html',
    styleUrl: './discover-page.component.scss',
    imports: [
        AsyncPipe,
        RouterLink,
        MatButtonModule,
        MatChipsModule,
        MediaListItemComponent,
        PersonListItemComponent,
        SortButtonComponent,
    ],
    providers: [DiscoverStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverPageComponent {
    constructor(
        public store: DiscoverStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
    ) {
        this.route.queryParamMap
            .pipe(
                switchMap((params) => {
                    const category = params.get(
                        'category',
                    ) as BrowseCategory | null;
                    const type = (params.get('type') as DiscoverType) || 'all';
                    const keywords = parseCsvParam(params.get('keywords'));
                    const sortField = params.get('sortField') || undefined;
                    const sortDirection =
                        (params.get('sortDirection') as SortDirection) ||
                        undefined;

                    if (
                        category &&
                        (type === 'movie' || type === 'tv' || type === 'person')
                    ) {
                        return this.store.browse$(
                            category,
                            type as BrowseMediaType,
                            sortField,
                            sortDirection,
                            keywords,
                        );
                    }

                    if (
                        keywords.length &&
                        (type === 'movie' || type === 'tv')
                    ) {
                        return this.store.browse$(
                            'popular',
                            type as BrowseMediaType,
                            sortField,
                            sortDirection,
                            keywords,
                        );
                    }

                    const query = params.get('query') ?? '';

                    return this.store.search$(query, type);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.categoryConfig$
            .pipe(
                tap((config) => {
                    if (config) {
                        console.log(config.title);
                        this.titleService.setTitle(config.title);
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.query$
            .pipe(
                tap((q) => {
                    if (q) {
                        this.titleService.setTitle(`Search "${q}"`);
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    loadMoreBrowse() {
        this.store.loadMoreBrowse$().subscribe();
    }

    onSortChange(sortField: unknown) {
        this.store.updateSort(sortField as string);
    }

    toggleSortDirection() {
        this.store.toggleSortDirection();
    }

    loadMoreMovies() {
        this.store.loadMoreMovies$().subscribe();
    }

    loadMoreTv() {
        this.store.loadMoreTv$().subscribe();
    }

    loadMorePeople() {
        this.store.loadMorePeople$().subscribe();
    }

    setType(type: DiscoverType) {
        this.store.updateType(type);
    }
}
