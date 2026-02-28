import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';

import { Video } from '../../../api';
import { SubPageBannerComponent } from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type SortField = 'published_at' | 'type' | 'name';
type SortDirection = 'asc' | 'desc';

@Component({
    selector: 'app-videos-page',
    imports: [AsyncPipe, DatePipe, MatSelectModule, SubPageBannerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './videos-page.component.html',
    styleUrl: './videos-page.component.scss',
})
export class VideosPageComponent {
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

    setSortField(event: MatSelectChange): void {
        this.sortFieldSubject.next(event.value);
    }

    toggleSortDirection(): void {
        this.sortDirectionSubject.next(
            this.sortDirectionSubject.value === 'asc' ? 'desc' : 'asc',
        );
    }

    getYoutubeThumbnail(key: string): string {
        return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
    }

    getYoutubeUrl(key: string): string {
        return `https://www.youtube.com/watch?v=${key}`;
    }
}
