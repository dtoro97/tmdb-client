import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { combineLatest, map, switchMap, tap } from 'rxjs';

import {
    PhotoViewerComponent,
    PhotosBrowserComponent,
    PhotosBrowserSelection,
    PhotosBrowserSkeletonComponent,
    SubPageHeaderComponent,
} from '../../../shared';
import { EpisodeDetailStoreService } from '../episode-detail-page/episode-detail-store.service';
import { MediaDetailStoreService } from '../media-detail-store.service';

@Component({
    selector: 'app-episode-photos-page',
    imports: [AsyncPipe, PhotosBrowserComponent, PhotosBrowserSkeletonComponent, SubPageHeaderComponent],
    templateUrl: './episode-photos-page.component.html',
    styleUrl: './episode-photos-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodePhotosPageComponent {
    readonly episodeCode: string;
    readonly backLink: readonly string[];

    readonly vm$ = combineLatest({
        mediaState: this.mediaStoreService.mediaDetailsState$,
        episodeState: this.episodeStore.episodeState$,
        photosState: this.episodeStore.allStillsState$,
    }).pipe(
        map(({ mediaState, episodeState, photosState }) => {
            const media = mediaState.type === 'loaded' ? mediaState.value : null;
            const episode = episodeState.type === 'loaded' ? (episodeState.value[0] ?? null) : null;
            const pageTitle = episode?.name ? `${episode.name} Photos` : `${this.episodeCode} Photos`;
            const subtitle = media?.title
                ? `${media.title}${media.year ? ` (${media.year})` : ''} - ${this.episodeCode}`
                : this.episodeCode;

            return {
                media,
                episode,
                photosState,
                pageTitle,
                subtitle,
            };
        }),
    );

    constructor(
        private readonly mediaStoreService: MediaDetailStoreService,
        private readonly episodeStore: EpisodeDetailStoreService,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly title: Title,
    ) {
        const seriesId = Number(this.route.parent!.snapshot.paramMap.get('id'));
        const mediaType = this.route.parent!.snapshot.paramMap.get('type') ?? 'tv';
        const seasonNumber = Number(this.route.snapshot.paramMap.get('seasonNumber'));
        const episodeNumber = Number(this.route.snapshot.paramMap.get('episodeNumber'));

        this.episodeCode = `S${seasonNumber}E${episodeNumber}`;
        this.backLink = [
            '/title',
            String(seriesId),
            mediaType,
            'episodes',
            String(seasonNumber),
            String(episodeNumber),
        ];

        combineLatest([this.route.paramMap, this.route.parent!.paramMap])
            .pipe(
                switchMap(([params, parentParams]) =>
                    this.episodeStore.getEpisodeImages$(
                        Number(parentParams.get('id')),
                        Number(params.get('seasonNumber')),
                        Number(params.get('episodeNumber')),
                    ),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.vm$
            .pipe(
                tap((vm) => {
                    if (vm.media) {
                        this.title.setTitle(`${vm.media.title} | ${vm.pageTitle}`);
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
