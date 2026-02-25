import { get } from 'lodash';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { combineLatest, map, Observable } from 'rxjs';

import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../../constants';
import {
  CardComponent,
  ConfigStoreService,
  FilterPipe,
  PersonCardComponent,
  SocialLinksComponent,
} from '../../../shared';
import { ImagePipe } from '../../../shared/pipes/image.pipe';
import { SortPipe } from '../../../shared/pipes/sort.pipe';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { YoutubeLinkPipe } from '../../../shared/pipes/youtube-link.pipe';
import { MediaStoreService } from '../media-store.service';
import { Movie, TvSeries } from '../../../api';

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
  providers: [MediaStoreService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-details.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailsComponent implements OnInit {
  mediaItem$ = this.mediaStoreService.media$;
  videos$ = this.mediaStoreService.youtubeVideos$;
  images$ = this.mediaStoreService.images$;
  mediaType$ = this.mediaStoreService.type$;
  isDarkMode$ = this.configStoreService.isDarkMode$;
  languages$: Observable<any[]>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;

  constructor(
    public mediaStoreService: MediaStoreService,
    public configStoreService: ConfigStoreService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    this.activeTab$ = this.route.params.pipe(map((p) => get(p, 'tab')));
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const type = this.route.snapshot.paramMap.get('type');
    this.mediaStoreService.getDetails$(id, type!).subscribe();
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
      this.configStoreService.languages$,
      this.mediaType$,
      this.mediaItem$,
    ]).pipe(
      map(([languages, type, item]) => {
        const langCodes =
          type === 'tv'
            ? (item as TvSeries).languages!
            : [(item as Movie).original_language!];
        return languages.length
          ? langCodes.map((code: string) =>
              languages.find((l: any) => l['iso_639_1'] === code),
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

  private getTitle(type: string, item: any): string {
    const name = get(item, 'title', get(item, 'name'));
    return `${name} | ${type === 'tv' ? 'TV Show' : 'Movie'}`;
  }

  private getTabs(type: string, videos: any[], photos: any, item: any) {
    return [
      { title: 'Overview', value: 'overview', visible: true },
      {
        title: 'Episodes',
        value: 'episodes',
        visible: type === 'tv' && item.seasons?.length > 0,
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
