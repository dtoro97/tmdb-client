import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    MediaThumbComponent,
    PillToggleComponent,
    RatingComponent,
    SkeletonComponent,
    SubPageBannerComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    switchMap,
    tap,
} from 'rxjs';
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
        SkeletonComponent,
        SubPageBannerComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episodes-page.component.html',
    styleUrl: './episodes-page.component.scss',
})
export class EpisodesPageComponent {
    readonly skeletonRows$ = this.mediaStoreService.selectedSeasonEpisodeCount$.pipe(
        map((count) => Array.from({ length: count }, (_, index) => index)),
    );

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

        combineLatest([
            this.mediaStoreService.viewModel$,
            this.mediaStoreService.selectedSeason$,
        ])
            .pipe(
                filter(([, seasonNumber]) => Number.isInteger(seasonNumber)),
                distinctUntilChanged(
                    ([prevVm, prevSeason], [nextVm, nextSeason]) =>
                        prevVm.id === nextVm.id && prevSeason === nextSeason,
                ),
                switchMap(([vm, seasonNumber]) =>
                    this.mediaStoreService.loadSeasonIfNeeded$(
                        vm.id,
                        seasonNumber as number,
                    ),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    changeSeason(value: unknown): void {
        this.mediaStoreService.updateSelectedSeason(value as number);
    }
}
