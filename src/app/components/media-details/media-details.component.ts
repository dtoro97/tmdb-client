import { get } from 'lodash';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { combineLatest, map, Observable } from 'rxjs';
import {
  Images,
  LanguageConfiguration,
  MediaType,
  MovieDetails,
  TvShowDetails,
  Video,
} from 'tmdb-ts';

import { AsyncPipe, CommonModule, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { MediaQuery, MediaService, StateQuery, StateService } from '../../core';
import { FilterPipe } from '../../shared';
import { ImagePipe } from '../../shared/pipes/image.pipe';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { MinutesToHours } from '../../shared/pipes/time.pipe';
import { YoutubeLinkPipe } from '../../shared/pipes/youtube-link.pipe';
import { CardComponent } from '../card/card.component';
import { PersonCardComponent } from '../person-card/person-card.component';
import { SocialLinksComponent } from '../social-links/social-links.component';

@Component({
  selector: 'app-media-details',
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
  templateUrl: './media-details.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailsComponent implements OnInit {
  mediaItem$: Observable<any>;
  videos$: Observable<Video[]>;
  images$: Observable<Images>;
  mediaType$: Observable<MediaType>;
  languages$: Observable<LanguageConfiguration[]>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;
  constructor(
    public mediaQuery: MediaQuery,
    public stateQuery: StateQuery,
    private route: ActivatedRoute,
    private router: Router,
    private scroller: ViewportScroller,
    private titleService: Title,
    private stateService: StateService,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.mediaItem$ = this.mediaQuery.media$;
    this.videos$ = this.mediaQuery.youtubeVideos$;
    this.images$ = this.mediaQuery.images$;
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type'))
    );
    this.activeTab$ = this.route.params.pipe(
      map((params) => get(params, 'tab'))
    );

    this.tabs$ = combineLatest([
      this.mediaType$,
      this.videos$,
      this.images$,
      this.mediaItem$,
    ]).pipe(
      map(([type, videos, photos, item]) => {
        //this.scroller.scrollToPosition([0, 0]);
        this.titleService.setTitle(this.getTitle(type, item));
        return this.getTabs(type, videos, photos, item);
      })
    );

    this.languages$ = combineLatest([
      this.stateQuery.languages$,
      this.mediaType$,
      this.mediaItem$,
    ]).pipe(
      map(([languages, type, item]) => {
        this.stateService.setLoading(false);
        const langCodes =
          type === 'tv' ? item.languages : [item.original_language];
        return languages.length
          ? langCodes.map((code: string) =>
              languages.find((l) => l['iso_639_1'] === code)
            )
          : langCodes;
      })
    );
  }

  changeTab(tab: string): void {
    this.router.navigate([`../${tab}`], { relativeTo: this.route });
  }

  changeSeason(season: number): void {
    this.mediaService.updateSelectedSeason(season);
  }

  private getTitle(type: string, item: TvShowDetails | MovieDetails): string {
    const name = get(item, 'title', get(item, 'name'));
    return `${name} | ${type === 'tv' ? 'TV Show' : 'Movie'}`;
  }

  private getTabs(type: MediaType, videos: Video[], photos: Images, item: any) {
    return [
      { title: 'Overview', value: 'overview', visible: true },
      {
        title: 'Episodes',
        value: 'episodes',
        visible: type === 'tv' && item.seasons.length > 0,
      },
      { title: 'Videos', value: 'videos', visible: videos.length > 0 },
      {
        title: 'Photos',
        value: 'photos',
        visible: Object.values(photos).some(
          (v) => Array.isArray(v) && v.length > 0
        ),
      },
    ];
  }
}
