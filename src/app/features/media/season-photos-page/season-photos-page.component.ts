import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, filter, map, tap } from 'rxjs';

import { TvSeries } from '../../../api';
import {
    PhotoViewerComponent,
    PhotosBrowserComponent,
    PhotosBrowserSelection,
    PhotosBrowserSkeletonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';

@Component({
    selector: 'app-season-photos-page',
    imports: [AsyncPipe, PhotosBrowserComponent, PhotosBrowserSkeletonComponent, SubPageHeaderComponent],
    templateUrl: './season-photos-page.component.html',
    styleUrl: './season-photos-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonPhotosPageComponent {
    readonly pageTitle: string;
    readonly backLink: readonly string[];

    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        photosState: this.mediaSeasonsStoreService.seasonImagesState$,
    }).pipe(
        map(({ mediaState, photosState }) => {
            const media = mediaState.type === 'loaded' ? mediaState.value : null;

            return {
                media,
                photosState,
                showSkeleton:
                    mediaState.type === 'idle' ||
                    mediaState.type === 'loading' ||
                    photosState.type === 'idle' ||
                    photosState.type === 'loading',
                subtitle: media?.title ? `${media.title}${media.year ? ` (${media.year})` : ''}` : null,
            };
        }),
    );

    constructor(
        private readonly mediaStoreService: MediaDetailStoreService,
        private readonly mediaSeasonsStoreService: MediaSeasonsStoreService,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly title: Title,
    ) {
        const seriesId = Number(this.route.parent!.snapshot.paramMap.get('id'));
        const mediaType = this.route.parent!.snapshot.paramMap.get('type') ?? 'tv';
        const seasonNumber = Number(this.route.snapshot.paramMap.get('seasonNumber'));

        this.pageTitle = `Season ${seasonNumber} Photos`;
        this.backLink = ['/title', String(seriesId), mediaType, 'episodes'];
        this.mediaSeasonsStoreService.setSeriesId(seriesId);
        this.mediaSeasonsStoreService.updateSelectedSeason(seasonNumber);

        this.mediaStoreService.rawMedia$
            .pipe(
                filter((media): media is TvSeries => !!media && Array.isArray((media as TvSeries).seasons)),
                tap((series) => {
                    this.mediaSeasonsStoreService.initializeFromSeries(series);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.vm$
            .pipe(
                tap((vm) => {
                    if (vm.media) {
                        this.title.setTitle(`${vm.media.title} | ${this.pageTitle}`);
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    openPhotoViewer(selection: PhotosBrowserSelection): void {
        this.dialog.open(PhotoViewerComponent, {
            data: { images: selection.images, activeIndex: selection.index },
            panelClass: 'photo-viewer-panel',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            autoFocus: false,
        });
    }
}
