import { get } from 'lodash';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { Images, MediaType, MovieDetails, TvShowDetails, Video } from 'tmdb-ts';

import { AsyncPipe, CommonModule, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  CardComponent,
  FilterPipe,
  ImagePipe,
  MediaTypeEnum,
  MinutesToHours,
  PersonCardComponent,
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
    TabsModule,
    CarouselModule,
    SelectModule,
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
    FilterPipe,
    SocialLinksComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-detail-page.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailPageComponent {
  mediaItem$: Observable<MovieDetails | TvShowDetails>;
  videos$: Observable<Video[]>;
  images$: Observable<Images>;
  mediaType$: Observable<MediaType>;
  languages$: Observable<any>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scroller: ViewportScroller,
    private titleService: Title,
    public mediaStoreService: MediaStoreService,
    public globalStore: GlobalStore,
  ) {
    this.mediaItem$ = this.mediaStoreService.media$.pipe(
      tap(() => this.scroller.scrollToPosition([0, 0])),
    );
    this.videos$ = this.mediaStoreService.youtubeVideos$;
    this.images$ = this.mediaStoreService.images$;
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type')),
    );
    this.activeTab$ = this.route.params.pipe(
      map((params) => get(params, 'tab')),
    );

    this.tabs$ = combineLatest([
      this.mediaType$,
      this.videos$,
      this.images$,
      this.mediaItem$,
    ]).pipe(
      map(([type, videos, photos, item]) => {
        this.titleService.setTitle(this.getTitle(type, item));
        return this.getTabs(type, videos, photos, item);
      }),
    );

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

  changeTab(tab: string): void {
    this.router.navigate([`../${tab}`], { relativeTo: this.route });
  }

  changeSeason(season: number): void {
    this.mediaStoreService.updateSelectedSeason(season);
  }

  private getTitle(type: string, item: TvShowDetails | MovieDetails): string {
    const name = get(item, 'title', get(item, 'name'));
    return `${name} | ${type === MediaTypeEnum.TV ? 'TV Show' : 'Movie'}`;
  }

  private getTabs(
    type: MediaType,
    videos: Video[],
    photos: Images,
    item: MovieDetails | TvShowDetails,
  ) {
    return [
      { title: 'Overview', value: 'overview', visible: true },
      {
        title: 'Episodes',
        value: 'episodes',
        visible:
          type === MediaTypeEnum.TV &&
          (item as TvShowDetails).seasons.length > 0,
      },
      { title: 'Videos', value: 'videos', visible: videos.length > 0 },
      {
        title: 'Photos',
        value: 'photos',
        visible: Object.values(photos).some(
          (v) => Array.isArray(v) && v.length > 0,
        ),
      },
    ];
  }
}
