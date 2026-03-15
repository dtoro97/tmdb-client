import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';

import { Video } from '../../../api';
import {
    SortButtonComponent,
    SubPageBannerComponent,
    YoutubeVideoComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type SortField = 'published_at' | 'type' | 'name';
type SortDirection = 'asc' | 'desc';

@Component({
    selector: 'app-videos-page',
    imports: [
        AsyncPipe,
        SortButtonComponent,
        SubPageBannerComponent,
        YoutubeVideoComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './videos-page.component.html',
    styleUrl: './videos-page.component.scss',
})
export class VideosPageComponent {
    readonly sortOptions = [
        { label: 'Date', value: 'published_at' as const },
        { label: 'Type', value: 'type' as const },
        { label: 'Name', value: 'name' as const },
    ];

    readonly sortFieldSubject = new BehaviorSubject<SortField>('published_at');
    readonly sortDirectionSubject = new BehaviorSubject<SortDirection>('desc');

    readonly sortField$ = this.sortFieldSubject.asObservable();
    readonly sortDirection$ = this.sortDirectionSubject.asObservable();

    readonly videos$ = combineLatest([
        this.mediaStoreService.allVideos$,
        this.sortField$,
        this.sortDirection$,
    ]).pipe(
        map(([videos, field, direction]) => {
            const sorted = [...videos].sort((a, b) => {
                const aVal = String((a as Video)[field] ?? '');
                const bVal = String((b as Video)[field] ?? '');
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            });
            return direction === 'desc' ? sorted.reverse() : sorted;
        }),
    );

    readonly countLabel$ = this.videos$.pipe(
        map((videos) => `1-${videos.length} of ${videos.length}`),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private title: Title,
    ) {
        this.mediaStoreService.title$
            .pipe(
                takeUntilDestroyed(),
                tap((title) => this.title.setTitle(`${title} | Videos`)),
            )
            .subscribe();
    }

    setSortField(value: unknown): void {
        this.sortFieldSubject.next(value as SortField);
    }

    toggleSortDirection(): void {
        this.sortDirectionSubject.next(
            this.sortDirectionSubject.value === 'asc' ? 'desc' : 'asc',
        );
    }
}
