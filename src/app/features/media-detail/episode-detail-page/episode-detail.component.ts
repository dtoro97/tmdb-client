import { AsyncPipe, DatePipe, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { combineLatest, switchMap, take, tap } from 'rxjs';

import type { ViewerImage } from '../../../shared';
import {
    CastCrewGridComponent,
    MediaThumbComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    RatingComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaStoreService } from '../media-store.service';
import { EpisodeDetailStoreService } from './episode-detail-store.service';

@Component({
    selector: 'app-episode-detail',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatChipsModule,
        MatDialogModule,
        CastCrewGridComponent,
        MediaThumbComponent,
        PhotosGridComponent,
        RatingComponent,
        MinutesToHours,
    ],
    providers: [EpisodeDetailStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './episode-detail.component.html',
    styleUrl: './episode-detail.component.scss',
})
export class EpisodeDetailComponent {
    constructor(
        public episodeStore: EpisodeDetailStoreService,
        public mediaStore: MediaStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
        private scroller: ViewportScroller,
        private dialog: MatDialog,
    ) {
        combineLatest([this.route.paramMap, this.route.parent!.paramMap])
            .pipe(
                switchMap(([params, parentParams]) => {
                    const seriesId = Number(parentParams.get('id'));
                    const seasonNumber = Number(params.get('seasonNumber'));
                    const episodeNumber = Number(params.get('episodeNumber'));
                    return this.episodeStore.getEpisodeDetails$(
                        seriesId,
                        seasonNumber,
                        episodeNumber,
                    );
                }),
            )
            .subscribe();

        this.episodeStore.episode$
            .pipe(
                tap((episode) => {
                    this.titleService.setTitle(`${episode.name} | Episode`);
                    this.scroller.scrollToPosition([0, 0]);
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
