import { get } from 'lodash';
import { combineLatest, map, Observable } from 'rxjs';
import {
  Cast,
  ExternalIds,
  Images,
  MovieDetails,
  Recommendation,
  TvShowDetails,
  Video,
} from 'tmdb-ts';

import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { StateQuery } from '../../state/state.query';
import { StateService } from '../../state/state.service';

@Component({
  selector: 'app-media-details',
  standalone: false,
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
  recommendations$: Observable<Recommendation[]>;
  externalIds$: Observable<ExternalIds>;
  mediaType$: Observable<string>;
  isDarkMode$: Observable<boolean>;
  languages$: Observable<string>;
  isMobile$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  hasPoster = false;
  hasBackdrop$: Observable<boolean>;
  constructor(
    private route: ActivatedRoute,
    private sessionQuery: StateQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.externalIds$ = this.route.data.pipe(
      map((data) => get(data, 'externalIds'))
    );
    this.cast$ = this.route.data.pipe(map((data) => get(data, 'credits.cast')));
    this.item$ = this.route.data.pipe(map((data) => get(data, 'item')));
    this.backdrop$ = this.item$.pipe(map((item) => get(item, 'backdrop_path')));
    this.videos$ = this.route.data.pipe(
      map((data) =>
        get(data, 'videos')
          .filter((video: Video) => video.site === 'Youtube')
          .slice(0, 5)
      )
    );
    this.images$ = this.route.data.pipe(map((data) => get(data, 'images')));
    this.recommendations$ = this.route.data.pipe(
      map((data) => get(data, 'recommendations'))
    );
    this.hasBackdrop$ = this.images$.pipe(
      map((images: Images) => images.backdrops.length > 0)
    );
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type'))
    );

    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
    this.languages$ = combineLatest([
      this.sessionQuery.languages$,
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

  private getTitle(params: any, data: any): string {
    const name = get(data, 'item.title', get(data, 'item.name'));
    const type = params['type'];
    return `${name} | ${type === 'tv' ? 'TV Show' : 'Movie'}`;
  }
}
