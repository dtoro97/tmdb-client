import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { MatChipsModule } from '@angular/material/chips';

import { combineLatest, filter, map, tap } from 'rxjs';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    groupCrewMembers,
    ImageComponent,
    PillToggleComponent,
    RatingComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { CastCrewGridComponent } from '../cast-crew-grid/cast-crew-grid.component';

type VisibleSection = 'all' | 'cast' | 'crew';

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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-page.component.html',
    styleUrl: './media-cast-page.component.scss',
})
export class MediaCastPageComponent {
    visibleSection: VisibleSection = 'all';

    private readonly groupedCrew$ = this.mediaStoreService.crew$.pipe(
        map((crew) => groupCrewMembers(crew)),
    );

    private readonly filters$ = this.mediaStoreService.castCrew$.pipe(
        map((castCrew) => ({
            options: [
                { label: 'All', value: 'all' as const },
                ...(castCrew.cast.length ? [{ label: 'Cast', value: 'cast' as const }] : []),
                ...(castCrew.crew.length ? [{ label: 'Crew', value: 'crew' as const }] : []),
            ],
        })),
    );

    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        castCrew: this.mediaStoreService.castCrew$,
        castState: this.mediaStoreService.castState$,
        crewState: this.mediaStoreService.crewState$,
        groupedCrew: this.groupedCrew$,
        filters: this.filters$,
    }).pipe(
        map(({ mediaState, castCrew, castState, crewState, groupedCrew, filters }) => ({
            media: mediaState.type === 'loaded' ? mediaState.value : null,
            cast: castCrew.cast,
            crew: castCrew.crew,
            castState,
            crewState,
            groupedCrew,
            filters: filters.options,
            isLoading:
                castState.type === 'loading' ||
                castState.type === 'idle' ||
                crewState.type === 'loading' ||
                crewState.type === 'idle',
            isEmpty:
                castState.type === 'loaded' &&
                crewState.type === 'loaded' &&
                !castCrew.cast.length &&
                !castCrew.crew.length,
        })),
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
        this.visibleSection = (value as VisibleSection) ?? 'all';
    }
}
