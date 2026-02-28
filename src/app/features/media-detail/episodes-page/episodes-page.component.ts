import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    MediaThumbComponent,
    PillToggleComponent,
    RatingComponent,
    SubPageBannerComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-episodes-page',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MediaThumbComponent,
        PillToggleComponent,
        RatingComponent,
        SubPageBannerComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episodes-page.component.html',
    styleUrl: './episodes-page.component.scss',
})
export class EpisodesPageComponent {
    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private title: Title,
    ) {
        this.mediaStoreService.viewModel$
            .pipe(
                takeUntilDestroyed(),
                tap((vm) => {
                    this.title.setTitle(`${vm.title} | Episodes`);
                }),
            )
            .subscribe();
    }

    changeSeason(value: unknown): void {
        this.mediaStoreService.updateSelectedSeason(value as number);
    }
}
