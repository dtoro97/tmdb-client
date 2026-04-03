import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { combineLatest, switchMap, take, tap } from 'rxjs';

import { ViewerImage } from '../../../shared';
import {
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RatingComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    VideosGridComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaDetailStoreService } from '../media-detail-store.service';
import { MediaSeasonsStoreService } from '../media-seasons-store.service';
import { EpisodeDetailStoreService } from './episode-detail-store.service';
import { CastCrewGridComponent } from '../cast-crew-grid/cast-crew-grid.component';

@Component({
    selector: 'app-episode-detail',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatChipsModule,
        MatDialogModule,
        CastCrewGridComponent,
        ImageComponent,
        PageSectionComponent,
        PhotosGridComponent,
        RatingComponent,
        SkeletonComponent,
        MinutesToHours,
        SubPageHeaderComponent,
        VideosGridComponent,
    ],
    providers: [EpisodeDetailStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episode-detail.component.html',
    styleUrl: './episode-detail.component.scss',
})
export class EpisodeDetailComponent {
    readonly vm$ = this.episodeStore.vm$;

    constructor(
        public episodeStore: EpisodeDetailStoreService,
        private mediaStore: MediaDetailStoreService,
        public mediaSeasonsStore: MediaSeasonsStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
        private dialog: MatDialog,
    ) {
        combineLatest([this.route.paramMap, this.route.parent!.paramMap])
            .pipe(
                switchMap(([params, parentParams]) => {
                    const seriesId = Number(parentParams.get('id'));
                    const seasonNumber = Number(params.get('seasonNumber'));
                    const episodeNumber = Number(params.get('episodeNumber'));
                    this.mediaSeasonsStore.setSeriesId(seriesId);
                    this.mediaSeasonsStore.updateSelectedSeason(seasonNumber);
                    return this.episodeStore.getEpisodeDetails$(
                        seriesId,
                        seasonNumber,
                        episodeNumber,
                    );
                }),
            )
            .subscribe();

        this.mediaStore.rawMedia$
            .pipe(
                tap((media) => {
                    if (media && 'seasons' in media) {
                        this.mediaSeasonsStore.initializeFromSeries(media);
                    }
                }),
            )
            .subscribe();

        this.vm$
            .pipe(
                tap((vm) => {
                    if (vm.episode) {
                        this.titleService.setTitle(
                            `${vm.episode.name} | Episode`,
                        );
                    }
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.episodeStore.allStills$
            .pipe(take(1))
            .subscribe((images: ViewerImage[]) => {
                this.dialog.open(PhotoViewerComponent, {
                    data: { images, activeIndex: index },
                    panelClass: 'photo-viewer-panel',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    width: '100vw',
                    height: '100vh',
                    autoFocus: false,
                });
            });
    }
}
