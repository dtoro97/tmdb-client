import { get } from 'lodash';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { GalleriaModule } from 'primeng/galleria';
import { RatingModule } from 'primeng/rating';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { Image, MediaType, MovieDetails, TvShowDetails, Video } from 'tmdb-ts';

import { AsyncPipe, CommonModule, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  CardComponent,
  ImagePipe,
  MediaTypeEnum,
  MinutesToHours,
  PersonCardComponent,
  PillToggleComponent,
  SocialLinksComponent,
  SortPipe,
  YoutubeLinkPipe,
} from '../../../shared';
import { CAROUSEL_BREAKPOINTS } from '../../../constants';
import { MediaStoreService } from '../media-store.service';
import { GlobalStore } from '../../../core';

@Component({
  selector: 'app-media-detail-page',
  imports: [
    RatingModule,
    ChipModule,
    GalleriaModule,
    CarouselModule,
    ImagePipe,
    MinutesToHours,
    AsyncPipe,
    CommonModule,
    SortPipe,
    CardComponent,
    PersonCardComponent,
    YoutubeLinkPipe,
    FormsModule,
    RouterLink,
    SocialLinksComponent,
    PillToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-detail-page.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailPageComponent {
  mediaItem$: Observable<MovieDetails | TvShowDetails>;
  videos$: Observable<Video[]>;
  mediaType$: Observable<MediaType>;
  languages$: Observable<any>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  galleriaVisible = false;
  galleriaImages: { source: string; thumbnail: string }[] = [];
  galleriaActiveIndex = 0;
  allBackdrops: Image[] = [];
  allPosters: Image[] = [];
  seasons$: Observable<{ label: string; value: number }[]>;
  constructor(
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title,
    private cdr: ChangeDetectorRef,
    public mediaStoreService: MediaStoreService,
    public globalStore: GlobalStore,
  ) {
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type')),
    );
    this.seasons$ = this.mediaStoreService.seasons$.pipe(
      map((season) =>
        season.map((s) => ({ label: s.name, value: s.season_number })),
      ),
    );

    this.mediaItem$ = combineLatest([
      this.mediaStoreService.media$,
      this.mediaType$,
    ]).pipe(
      tap(([item, type]) => {
        this.scroller.scrollToPosition([0, 0]);
        this.titleService.setTitle(this.getTitle(type, item));
      }),
      map(([item]) => item),
    );

    this.videos$ = this.mediaStoreService.youtubeVideos$;

    this.mediaStoreService.images$
      .pipe(
        tap((images) => {
          this.allBackdrops = images.backdrops;
          this.allPosters = images.posters;
        }),
      )
      .subscribe();

    this.languages$ = combineLatest([
      this.mediaStoreService.languages$,
      this.mediaType$,
      this.mediaItem$,
    ]).pipe(
      map(([languages, type, item]) => {
        const langCodes =
          type === MediaTypeEnum.TV
            ? (item as TvShowDetails).languages
            : [item.original_language];
        return languages.length
          ? langCodes.map((code: string) =>
              languages.find((l) => l['iso_639_1'] === code),
            )
          : langCodes;
      }),
    );
  }

  changeSeason(season: number): void {
    this.mediaStoreService.updateSelectedSeason(season);
  }

  onGalleriaClose(): void {
    this.galleriaVisible = false;
    this.cdr.markForCheck();
  }

  openGalleria(images: Image[], startIndex = 0): void {
    this.galleriaImages = images.map((img) => ({
      source: `https://image.tmdb.org/t/p/original${img.file_path}`,
      thumbnail: `https://image.tmdb.org/t/p/w300${img.file_path}`,
    }));
    this.galleriaActiveIndex = startIndex;
    this.galleriaVisible = true;
    this.cdr.markForCheck();
  }

  private getTitle(type: string, item: TvShowDetails | MovieDetails): string {
    const name = get(item, 'title', get(item, 'name'));
    return `${name} | ${type === MediaTypeEnum.TV ? 'TV Show' : 'Movie'}`;
  }
}
