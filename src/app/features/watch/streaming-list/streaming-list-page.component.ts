import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    MediaListItemComponent,
    NotFoundComponent,
    ToggleGroupComponent,
    RepeatPipe,
    SkeletonComponent,
    SortButtonComponent,
    WatchlistToggleComponent,
} from '../../../shared';
import { StreamingListStoreService } from './streaming-list-store.service';

@Component({
    selector: 'app-streaming-list-page',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        EmptyStateComponent,
        MediaListItemComponent,
        MatButtonModule,
        NotFoundComponent,
        ToggleGroupComponent,
        RepeatPipe,
        RouterLink,
        SkeletonComponent,
        SortButtonComponent,
        WatchlistToggleComponent,
    ],
    providers: [StreamingListStoreService],
    templateUrl: './streaming-list-page.component.html',
    styleUrl: './streaming-list-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingListPageComponent {
    readonly vm$ = this.store.vm$;

    constructor(private readonly store: StreamingListStoreService) {}

    onSortChange(value: unknown): void {
        this.store.updateSort(value);
    }

    onMediaTypeChange(value: unknown): void {
        this.store.updateMediaType(value);
    }

    toggleSortDirection(): void {
        this.store.toggleSortDirection();
    }

    loadMore(): void {
        this.store.loadMore();
    }
}
