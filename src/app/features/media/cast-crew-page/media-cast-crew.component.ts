import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { filter, map, tap } from 'rxjs';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    groupCrewMembers,
    MediaDetails,
    ImageComponent,
    PillToggleComponent,
    RatingComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    RepeatPipe,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { CastCrewGridComponent } from '../cast-crew-grid/cast-crew-grid.component';

type CastCrewVisibleSection = 'all' | 'cast' | 'crew';

interface CastCrewToolbarVm {
    readonly filterOptions: {
        readonly label: string;
        readonly value: CastCrewVisibleSection;
    }[];
}

@Component({
    selector: 'app-media-cast-crew',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        MatChipsModule,
        ImageComponent,
        PillToggleComponent,
        RatingComponent,
        SkeletonComponent,
        CastCrewGridComponent,
        EmptyStateComponent,
        SubPageHeaderComponent,
        MinutesToHours,
        RepeatPipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-crew.component.html',
    styleUrl: './media-cast-crew.component.scss',
})
export class MediaCastCrewComponent {
    visibleSection: CastCrewVisibleSection = 'all';

    readonly vm$ = this.mediaStoreService.mediaDetails$.pipe(
        filter((media): media is MediaDetails => !!media),
    );

    readonly castCrew$ = this.mediaStoreService.castCrew$;
    readonly castState$ = this.mediaStoreService.castState$;
    readonly crewState$ = this.mediaStoreService.crewState$;
    readonly groupedCrew$ = this.mediaStoreService.crew$.pipe(
        map((crew) => groupCrewMembers(crew)),
    );
    readonly creditToolbar$ = this.castCrew$.pipe(
        map(
            (castCrew): CastCrewToolbarVm => ({
                filterOptions: [
                    {
                        label: 'All',
                        value: 'all',
                    },
                    ...(castCrew.cast.length
                        ? [
                              {
                                  label: 'Cast',
                                  value: 'cast' as const,
                              },
                          ]
                        : []),
                    ...(castCrew.crew.length
                        ? [
                              {
                                  label: 'Crew',
                                  value: 'crew' as const,
                              },
                          ]
                        : []),
                ],
            }),
        ),
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

    onVisibleSectionsChange(value: unknown): void {
        this.visibleSection = (value as CastCrewVisibleSection) ?? 'all';
    }
}
