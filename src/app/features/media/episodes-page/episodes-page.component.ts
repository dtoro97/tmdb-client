import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, filter, map, tap } from 'rxjs';

import {
    BadgeComponent,
    ImageComponent,
    PillToggleComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    RatingBadgeComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TvSeries } from '../../../api';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { EpisodeListComponent } from '../episode-list/episode-list.component';

@Component({
    selector: 'app-episodes-page',
    imports: [
        AsyncPipe,
        BadgeComponent,
        DatePipe,
        RouterLink,
        ImageComponent,
        PillToggleComponent,
        EpisodeListComponent,
        SubPageHeaderComponent,
        SkeletonComponent,
        RatingBadgeComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episodes-page.component.html',
    styleUrl: './episodes-page.component.scss',
})
export class EpisodesPageComponent {
    private readonly episodeRoutePrefix$ = this.route.parent!.paramMap.pipe(
        map((params) => ['/title', Number(params.get('id')), params.get('type'), 'episodes']),
    );

    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        topState: this.mediaSeasonsStoreService.topRatedEpisode$,
        seasonInfo: this.mediaSeasonsStoreService.selectedSeasonInfo$,
        seasonOptions: this.mediaSeasonsStoreService.seasonPillOptions$,
        selectedSeason: this.mediaSeasonsStoreService.selectedSeason$,
        episodesState: this.mediaSeasonsStoreService.seasonEpisodesState$,
        routePrefix: this.episodeRoutePrefix$,
    }).pipe(
        map(({ mediaState, topState, seasonInfo, seasonOptions, selectedSeason, episodesState, routePrefix }) => ({
            media: mediaState.type === 'loaded' ? mediaState.value : null,
            latest: mediaState.type === 'loaded' ? (mediaState.value?.lastEpisode ?? null) : null,
            topState,
            seasonInfo,
            seasonOptions,
            selectedSeason,
            episodesState,
            routePrefix,
        })),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaSeasonsStoreService: MediaSeasonsStoreService,
        private route: ActivatedRoute,
        private title: Title,
    ) {
        this.mediaStoreService.title$
            .pipe(
                takeUntilDestroyed(),
                tap((title) => {
                    this.title.setTitle(`${title} | Episodes`);
                }),
            )
            .subscribe();

        this.route.parent?.paramMap
            .pipe(
                map((params) => Number(params.get('id'))),
                filter((id) => Number.isInteger(id)),
                tap((seriesId) => {
                    this.mediaSeasonsStoreService.setSeriesId(seriesId);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.mediaStoreService.rawMedia$
            .pipe(
                filter((media): media is TvSeries => !!media && Array.isArray((media as TvSeries).seasons)),
                tap((series) => {
                    this.mediaSeasonsStoreService.initializeFromSeries(series);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    changeSeason(value: unknown): void {
        this.mediaSeasonsStoreService.updateSelectedSeason(value as number);
    }
}
