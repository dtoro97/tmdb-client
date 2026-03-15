import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { combineLatest, map, tap } from 'rxjs';

import {
    CastCrewGridComponent,
    MediaThumbComponent,
    RatingComponent,
    SubPageBannerComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-media-cast-crew',
    imports: [
        AsyncPipe,
        MatChipsModule,
        MediaThumbComponent,
        RatingComponent,
        CastCrewGridComponent,
        SubPageBannerComponent,
        MinutesToHours,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-crew.component.html',
    styleUrl: './media-cast-crew.component.scss',
})
export class MediaCastCrewComponent {
    readonly vm$ = this.mediaStoreService.viewModel$;

    readonly castCrew$ = combineLatest([
        this.mediaStoreService.cast$,
        this.mediaStoreService.crew$,
    ]).pipe(map(([cast, crew]) => ({ cast, crew })));

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private title: Title,
    ) {
        this.mediaStoreService.viewModel$
            .pipe(
                takeUntilDestroyed(),
                tap((vm) => {
                    this.title.setTitle(`${vm.title} | Cast & Crew`);
                }),
            )
            .subscribe();
    }
}
