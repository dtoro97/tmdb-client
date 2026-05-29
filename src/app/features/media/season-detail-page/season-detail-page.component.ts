import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, filter, map, shareReplay, tap } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosPreviewComponent,
    ToggleGroupComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    TmdbRatingComponent,
    VideosGridComponent,
    ViewerImage,
} from '../../../shared';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { EpisodeListComponent } from '../episode-list/episode-list.component';
import { MediaStoreService } from '../media-store.service';

interface SeasonDetailRouteData {
    readonly seriesId: number;
    readonly mediaType: string;
    readonly seasonNumber: number | null;
    readonly routePrefix: readonly [string, number, string, string];
}

@Component({
    selector: 'app-season-detail-page',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatDialogModule,
        ImageComponent,
        PageSectionComponent,
        PhotosPreviewComponent,
        ToggleGroupComponent,
        EpisodeListComponent,
        SubPageHeaderComponent,
        SkeletonComponent,
        TmdbRatingComponent,
        VideosGridComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './season-detail-page.component.html',
    styleUrl: './season-detail-page.component.scss',
})
export class SeasonDetailPageComponent {
    private readonly routeData$ = combineLatest([this.route.parent!.paramMap, this.route.paramMap]).pipe(
        map(([parentParams, params]) => readSeasonDetailRoute(parentParams, params)),
        filter(({ seriesId }) => Number.isInteger(seriesId)),
        distinctUntilChanged(isSameSeasonDetailRoute),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    readonly vm$ = combineLatest({
        routeData: this.routeData$,
        mediaState: this.mediaStore.mediaDetailsState$,
        seasonSummary: this.mediaSeasonsStoreService.selectedSeasonSummary$,
        seasonOptions: this.mediaSeasonsStoreService.seasonOptions$,
        selectedSeason: this.mediaSeasonsStoreService.selectedSeasonNumber$,
        episodesState: this.mediaSeasonsStoreService.seasonEpisodesState$,
        seasonImagesState: this.mediaSeasonsStoreService.seasonImagesState$,
        seasonVideosState: this.mediaSeasonsStoreService.seasonVideosState$,
    }).pipe(
        map(
            ({
                routeData,
                mediaState,
                seasonSummary,
                seasonOptions,
                selectedSeason,
                episodesState,
                seasonImagesState,
                seasonVideosState,
            }) => ({
                media: mediaState.state === 'success' ? mediaState.data : null,
                seasonSummary,
                seasonOptions,
                selectedSeason,
                episodesState,
                seasonImagesState,
                seasonImages: seasonImagesState.state === 'success' ? seasonImagesState.data : [],
                seasonImagesTotalCount: seasonImagesState.state === 'success' ? seasonImagesState.data.length : 0,
                seasonPhotosLink:
                    selectedSeason !== null ? [...routeData.routePrefix, selectedSeason, 'photos'] : null,
                overviewLink: routeData.routePrefix.slice(0, 3),
                routeData,
                seasonVideosState,
                seasonVideoCount: seasonVideosState.state === 'success' ? seasonVideosState.data.length : 0,
            }),
        ),
    );

    constructor(
        public mediaStore: MediaStoreService,
        public mediaSeasonsStoreService: MediaSeasonsStoreService,
        private route: ActivatedRoute,
        private router: Router,
        private title: Title,
        private dialog: MatDialog,
    ) {
        this.mediaStore.title$
            .pipe(
                takeUntilDestroyed(),
                tap((title) => {
                    this.title.setTitle(`${title} | Episodes`);
                }),
            )
            .subscribe();

        this.routeData$
            .pipe(
                takeUntilDestroyed(),
                tap(({ seasonNumber, seriesId }) => {
                    if (seasonNumber !== null) {
                        this.mediaSeasonsStoreService.openSeason({ seriesId, seasonNumber });
                    } else {
                        this.mediaSeasonsStoreService.openSeries(seriesId);
                    }
                }),
            )
            .subscribe();
    }

    changeSeason(value: unknown, routeData: SeasonDetailRouteData): void {
        const seasonNumber = Number(value);

        if (!Number.isInteger(seasonNumber)) {
            return;
        }

        const { mediaType, seriesId } = routeData;

        if (!Number.isInteger(seriesId)) {
            return;
        }

        this.router.navigate(['/title', seriesId, mediaType, 'episodes', seasonNumber]);
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

    openSeasonPhotosPage(seasonNumber: number | null, routeData: SeasonDetailRouteData): void {
        if (seasonNumber === null) {
            return;
        }

        const { mediaType, seriesId } = routeData;

        if (!Number.isInteger(seriesId)) {
            return;
        }

        this.router.navigate(['/title', seriesId, mediaType, 'episodes', seasonNumber, 'photos']);
    }
}

const readSeasonDetailRoute = (parentParams: ParamMap, params: ParamMap): SeasonDetailRouteData => {
    const seriesId = Number(parentParams.get('id'));
    const mediaType = parentParams.get('type') ?? 'tv';
    const rawSeasonNumber = params.get('seasonNumber');
    const parsedSeasonNumber = rawSeasonNumber === null ? null : Number(rawSeasonNumber);
    const seasonNumber =
        parsedSeasonNumber !== null && Number.isInteger(parsedSeasonNumber) ? parsedSeasonNumber : null;

    return {
        seriesId,
        mediaType,
        seasonNumber,
        routePrefix: ['/title', seriesId, mediaType, 'episodes'],
    };
};

const isSameSeasonDetailRoute = (left: SeasonDetailRouteData, right: SeasonDetailRouteData): boolean =>
    left.seriesId === right.seriesId &&
    left.mediaType === right.mediaType &&
    left.seasonNumber === right.seasonNumber;
