import { get } from 'lodash';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  from,
  map,
  Observable,
  shareReplay,
  switchMap,
} from 'rxjs';
import {
  Cast,
  Episode,
  ExternalIds,
  Image,
  Images,
  MediaType,
  Recommendation,
  Season,
  Video,
} from 'tmdb-ts';

import { AsyncPipe, CommonModule, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { ImagePipe } from '../../shared/pipes/image.pipe';
import { MinutesToHours } from '../../shared/pipes/time.pipe';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { CardComponent } from '../card/card.component';
import { PersonCardComponent } from '../person-card/person-card.component';
import { YoutubeLinkPipe } from '../../shared/pipes/youtube-link.pipe';
import { FormsModule } from '@angular/forms';
import { StateQuery, StateService } from '../../core';
import { TmdbService } from '../../shared/services';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-details.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailsComponent implements OnInit {
  item$: Observable<any>;
  backdrop$: Observable<string>;
  cast$: Observable<Cast[]>;
  videos$: Observable<Video[]>;
  images$: Observable<Images>;
  backdrops$: Observable<Image[]>;
  posters$: Observable<Image[]>;
  recommendations$: Observable<Recommendation[]>;
  externalIds$: Observable<ExternalIds>;
  mediaType$: Observable<MediaType>;
  isDarkMode$: Observable<boolean>;
  languages$: Observable<string>;
  isMobile: Signal<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  hasPoster = false;
  hasBackdrop$: Observable<boolean>;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab: string = 'overview';
  episodeCount$: Observable<number>;
  selectedSeason$: Observable<number>;
  private _selectedSeason: BehaviorSubject<number> = new BehaviorSubject(1);
  seasons$: Observable<any>;
  private _seasons = new BehaviorSubject<any>([]);
  seasonEpisodes$: Observable<any>;
  episodes$: Observable<Episode[]>;
  constructor(
    private route: ActivatedRoute,
    private stateQuery: StateQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private stateService: StateService,
    private tmdb: TmdbService
  ) {}

  ngOnInit(): void {
    this.selectedSeason$ = this._selectedSeason.asObservable();
    this.seasons$ = this._seasons.asObservable();
    this.externalIds$ = this.route.data.pipe(
      map((data) => get(data, 'externalIds'))
    );
    this.cast$ = this.route.data.pipe(map((data) => get(data, 'credits.cast')));
    this.item$ = this.route.data.pipe(map((data) => get(data, 'item')));
    this.backdrop$ = this.item$.pipe(map((item) => get(item, 'backdrop_path')));
    this.videos$ = this.route.data.pipe(
      map((data) =>
        get(data, 'videos')
          .filter((video: Video) => video.site === 'YouTube')
          .slice(0, 5)
      )
    );

    this.item$
      .pipe(
        filter((item) => item.seasons),
        switchMap((item) => {
          return combineLatest(
            item.seasons.map((s: any) =>
              from(
                this.tmdb.tvSeasons.details({
                  tvShowID: item.id,
                  seasonNumber: s.season_number,
                })
              ).pipe(shareReplay(1))
            )
          );
        })
      )
      .subscribe((seasons: any) => {
        this._seasons.next(seasons);
      });

    this.episodeCount$ = combineLatest([
      this.selectedSeason$,
      this.seasons$,
    ]).pipe(
      map(
        ([season, seasons]) =>
          seasons.find((s: any) => s.season_number === season)?.episodes.length
      )
    );
    this.episodes$ = combineLatest([this.selectedSeason$, this.seasons$]).pipe(
      map(
        ([selected, seasons]) =>
          seasons.find((s: Season) => s.season_number === selected)?.episodes ||
          []
      )
    );

    this.images$ = this.route.data.pipe(map((data) => get(data, 'images')));
    this.backdrops$ = this.images$.pipe(
      map((images) => images.backdrops.slice(0, 20))
    );
    this.posters$ = this.images$.pipe(
      map((images) => images.posters.slice(0, 20))
    );
    this.recommendations$ = this.route.data.pipe(
      map((data) => get(data, 'recommendations'))
    );
    this.hasBackdrop$ = this.images$.pipe(
      map((images: Images) => images.backdrops.length > 0)
    );
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type'))
    );

    this.tabs$ = combineLatest([
      this.mediaType$,
      this.videos$,
      this.images$,
      this.item$,
    ]).pipe(
      map(([type, videos, photos, item]) =>
        this.getTabs(type, videos, photos, item)
      )
    );

    this.isMobile = this.stateQuery.isMobile;
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this.languages$ = combineLatest([
      this.stateQuery.languages$,
      this.route.params,
      this.route.data,
    ]).pipe(
      map(([languages, params, data]) => {
        this.titleService.setTitle(this.getTitle(params, data));
        this.stateService.setLoading(false);
        this.scroller.scrollToPosition([0, 0]);
        const langCodes =
          params['type'] === 'tv'
            ? data['item'].languages
            : [data['item'].original_language];
        return langCodes.map(
          (code: any) =>
            languages.find((l) => l['iso_639_1'] === code)?.english_name
        );
      })
    );
  }

  changeSeason(season: number): void {
    this._selectedSeason.next(season);
  }

  private getTitle(params: any, data: any): string {
    const name = get(data, 'item.title', get(data, 'item.name'));
    const type = params['type'];
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
          (v) => v !== Array.isArray(v) && v.length > 0
        ),
      },
    ];
  }
}
