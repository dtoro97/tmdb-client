import {
    catchError,
    EMPTY,
    filter,
    forkJoin,
    map,
    Observable,
    tap,
} from 'rxjs';

import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import {
    CrewMember,
    TvEpisode,
    TvEpisodeImages,
    TvEpisodeRestControllerService,
} from '../../../api';
import { isDefined, loader } from '../../../shared';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export interface EpisodeDetailState {
    episode: TvEpisode | undefined;
    images: TvEpisodeImages | undefined;
}

export interface GroupedCrew {
    department: string;
    members: CrewMember[];
}

@Injectable()
export class EpisodeDetailStoreService extends ComponentStore<EpisodeDetailState> {
    constructor(
        private tvEpisodeRestControllerService: TvEpisodeRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
    ) {
        super({ episode: undefined, images: undefined });
    }

    readonly episode$ = this.select((state) => state.episode).pipe(
        filter(isDefined),
    );

    readonly guestStars$ = this.select(
        (state) => state.episode?.guest_stars ?? [],
    );

    readonly groupedCrew$: Observable<GroupedCrew[]> = this.select(
        (state) => state.episode?.crew ?? [],
    ).pipe(
        map((crew) => {
            const groups = new Map<string, CrewMember[]>();
            for (const member of crew) {
                const dept = member.department ?? 'Other';
                if (!groups.has(dept)) {
                    groups.set(dept, []);
                }
                groups.get(dept)!.push(member);
            }
            return Array.from(groups.entries()).map(
                ([department, members]) => ({
                    department,
                    members,
                }),
            );
        }),
    );

    readonly stills$ = this.select((state) =>
        (state.images?.stills ?? []).slice(0, 12),
    );

    readonly allStills$ = this.select((state) => state.images?.stills ?? []);

    getEpisodeDetails$(
        seriesId: number,
        seasonNumber: number,
        episodeNumber: number,
    ): Observable<[TvEpisode, TvEpisodeImages]> {
        this.patchState({ episode: undefined, images: undefined });
        return forkJoin([
            this.tvEpisodeRestControllerService.tvEpisodeDetails(
                seriesId,
                seasonNumber,
                episodeNumber,
            ),
            this.tvEpisodeRestControllerService.tvEpisodeImages(
                seriesId,
                seasonNumber,
                episodeNumber,
            ),
        ]).pipe(
            loader(this.ngxUiLoaderService),
            tap(([episode, images]) => {
                this.patchState({ episode, images });
            }),
            catchError(() => EMPTY),
        );
    }
}
