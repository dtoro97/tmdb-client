import { AsyncPipe, DatePipe, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    MediaThumbComponent,
    PillToggleComponent,
    RatingComponent,
} from '../../../shared';
import { MediaStoreService } from '../media-store.service';

@Component({
    selector: 'app-episodes-page',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MediaThumbComponent,
        PillToggleComponent,
        RatingComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episodes-page.component.html',
    styleUrl: './episodes-page.component.scss',
})
export class EpisodesPageComponent {
    constructor(
        public mediaStoreService: MediaStoreService,
        private scroller: ViewportScroller,
    ) {
        this.scroller.scrollToPosition([0, 0]);
    }

    changeSeason(value: unknown): void {
        this.mediaStoreService.updateSelectedSeason(value as number);
    }
}
