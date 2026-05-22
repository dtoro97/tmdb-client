import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';

import { Video } from '../../../api';
import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    RepeatPipe,
    SkeletonComponent,
    SortButtonComponent,
    SubPageHeaderComponent,
    YoutubeVideoCardComponent,
    SortDirection,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaVideoStoreService } from '../media-video-store.service';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type SortField = 'published_at' | 'type' | 'name';

@Component({
    selector: 'app-videos-page',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        EmptyStateComponent,
        RepeatPipe,
        SkeletonComponent,
        SortButtonComponent,
        SubPageHeaderComponent,
        YoutubeVideoCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './videos-page.component.html',
    styleUrl: './videos-page.component.scss',
})
export class VideosPageComponent {
    readonly skeletonCount = 9;

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
        this.mediaVideoStoreService.allVideos$,
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

    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        videosState: this.mediaVideoStoreService.videosState$,
        videos: this.videos$,
        sortField: this.sortField$,
        sortDirection: this.sortDirection$,
    }).pipe(
        map(({ mediaState, videosState, videos, sortField, sortDirection }) => ({
            media: mediaState.type === 'loaded' ? mediaState.value : null,
            videosState,
            videos,
            sortField,
            sortDirection,
            isLoading:
                videosState.type === 'loading' || videosState.type === 'idle',
        })),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaVideoStoreService: MediaVideoStoreService,
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
