import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { filter, map, tap } from 'rxjs';

import {
    EmptyStateComponent,
    groupCrewMembers,
    MediaDetails,
    ImageComponent,
    RatingComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { CastCrewGridComponent } from '../cast-crew-grid/cast-crew-grid.component';

@Component({
    selector: 'app-media-cast-crew',
    imports: [
        AsyncPipe,
        MatChipsModule,
        ImageComponent,
        RatingComponent,
        SkeletonComponent,
        CastCrewGridComponent,
        EmptyStateComponent,
        SubPageHeaderComponent,
        MinutesToHours,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-crew.component.html',
    styleUrl: './media-cast-crew.component.scss',
})
export class MediaCastCrewComponent {
    readonly vm$ = this.mediaStoreService.mediaDetails$.pipe(
        filter((media): media is MediaDetails => !!media),
    );

    readonly castCrew$ = this.mediaStoreService.castCrew$;
    readonly castState$ = this.mediaStoreService.castState$;
    readonly crewState$ = this.mediaStoreService.crewState$;
    readonly groupedCrew$ = this.mediaStoreService.crew$.pipe(
        map((crew) => groupCrewMembers(crew)),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private title: Title,
    ) {
        this.mediaStoreService.title$
            .pipe(
                takeUntilDestroyed(),
                tap((title) => {
                    this.title.setTitle(`${title} | Cast & Crew`);
                }),
            )
            .subscribe();
    }
}
