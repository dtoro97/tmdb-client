import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';

import { combineLatest, map, tap } from 'rxjs';

import {
    EmptyStateComponent,
    groupCrewMembers,
    PillToggleComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { CastCrewGridComponent } from '../cast-crew-grid/cast-crew-grid.component';

type VisibleSection = 'cast' | 'crew';

@Component({
    selector: 'app-media-cast-crew',
    imports: [
        AsyncPipe,
        PillToggleComponent,
        SkeletonComponent,
        CastCrewGridComponent,
        EmptyStateComponent,
        SubPageHeaderComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-page.component.html',
    styleUrl: './media-cast-page.component.scss',
})
export class MediaCastPageComponent {
    visibleSection: VisibleSection = 'cast';

    private readonly groupedCrew$ = this.mediaStoreService.crew$.pipe(
        map((crew) => groupCrewMembers(crew)),
    );

    private readonly filters$ = this.mediaStoreService.castCrew$.pipe(
        map((castCrew) => ({
            options: [
                ...(castCrew.cast.length
                    ? [{ label: `Cast (${castCrew.cast.length})`, value: 'cast' as const }]
                    : []),
                ...(castCrew.crew.length
                    ? [{ label: `Crew (${castCrew.crew.length})`, value: 'crew' as const }]
                    : []),
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
        this.visibleSection = (value as VisibleSection) ?? 'cast';
    }
}
