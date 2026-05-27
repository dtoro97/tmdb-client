import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, filter, map, tap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosPreviewComponent,
    PillToggleComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    TmdbRatingComponent,
    VideosGridComponent,
    ViewerImage,
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
        DatePipe,
        RouterLink,
        MatDialogModule,
        ImageComponent,
        PageSectionComponent,
        PhotosPreviewComponent,
        PillToggleComponent,
        EpisodeListComponent,
        SubPageHeaderComponent,
        SkeletonComponent,
        TmdbRatingComponent,
        VideosGridComponent,
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
        seasonInfo: this.mediaSeasonsStoreService.selectedSeasonInfo$,
        seasonOptions: this.mediaSeasonsStoreService.seasonPillOptions$,
        selectedSeason: this.mediaSeasonsStoreService.selectedSeason$,
        episodesState: this.mediaSeasonsStoreService.seasonEpisodesState$,
        seasonImagesState: this.mediaSeasonsStoreService.seasonImagesState$,
        seasonVideosState: this.mediaSeasonsStoreService.seasonVideosState$,
        routePrefix: this.episodeRoutePrefix$,
    }).pipe(
        map(
            ({
                mediaState,
                seasonInfo,
                seasonOptions,
                selectedSeason,
                episodesState,
                seasonImagesState,
                seasonVideosState,
                routePrefix,
            }) => ({
                media: mediaState.type === 'loaded' ? mediaState.value : null,
                seasonInfo,
                seasonOptions,
                selectedSeason,
                episodesState,
                seasonImagesState,
                seasonImages: seasonImagesState.type === 'loaded' ? seasonImagesState.value : [],
                seasonImagesTotalCount: seasonImagesState.type === 'loaded' ? seasonImagesState.value.length : 0,
                seasonVideosState,
                seasonVideoCount: seasonVideosState.type === 'loaded' ? seasonVideosState.value.length : 0,
                routePrefix,
            }),
        ),
    );

    constructor(
        public mediaStoreService: MediaDetailStoreService,
        public mediaSeasonsStoreService: MediaSeasonsStoreService,
        private route: ActivatedRoute,
        private router: Router,
        private title: Title,
        private dialog: MatDialog,
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

    openPhotoViewer(index: number, images: ViewerImage[]): void {
        if (!images.length) {
            return;
        }

        this.dialog.open(PhotoViewerComponent, {
            data: { images, activeIndex: index },
            panelClass: 'photo-viewer-panel',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            autoFocus: false,
        });
    }

    openSeasonPhotosPage(seasonNumber: number | undefined): void {
        if (seasonNumber === undefined) {
            return;
        }

        this.router.navigate([seasonNumber, 'photos'], {
            relativeTo: this.route,
        });
    }
}
