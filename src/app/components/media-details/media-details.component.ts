import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionQuery } from '../../state/session.query';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  Subscription,
} from 'rxjs';
import {
  CAROUSEL_BREAKPOINTS,
  CAROUSEL_SM_BREAKPOINTS,
  CAROUSEL_YT_BREAKPOINTS,
} from '../../carousel-breakpoints';
import { ViewportScroller } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { LoaderService } from '../../services';

@Component({
  selector: 'app-media-details',
  standalone: false,

  templateUrl: './media-details.component.html',
  styleUrl: './media-details.component.scss',
})
export class MediaDetailsComponent implements OnInit, OnDestroy {
  item: any;
  cast: any[];
  videos: any[];
  recommendations: any[];
  mediaType: string;
  isDarkMode$: Observable<boolean>;
  languages$: Observable<string>;
  isMobile$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  breakpointsSmall = CAROUSEL_SM_BREAKPOINTS;
  breakpointsYoutube = CAROUSEL_YT_BREAKPOINTS;
  hasPoster = false;
  externalIds: any;
  private routeSubscription: Subscription;
  constructor(
    private route: ActivatedRoute,
    private sessionQuery: SessionQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.data.subscribe((data) => {
      this.item = data['item'];
      this.externalIds = data['externalIds'];
      this.cast = data['credits']['cast'];
      this.videos = data['videos']
        .filter((video: any) => video.site === 'YouTube')
        .slice(0, 5);
      console.log(this.item);
      this.recommendations = data['recommendations'];
      this.scroller.scrollToPosition([0, 0]);
      this.hasPoster = this.hasMediaPoster();
      this.loaderService.setLoading(false);
    });
    this.route.params.subscribe((params) => {
      this.mediaType = params['type'];
    });
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
    this.languages$ = combineLatest([
      this.sessionQuery.languages$,
      this.route.params,
      this.route.data,
    ]).pipe(
      map(([languages, params, data]) => {
        this.titleService.setTitle(this.getTitle(params));

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

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private getTitle(params: any): string {
    const name = this.item.title || this.item.name;
    const type = params['type'];
    return `${name} | ${type === 'tv' ? 'TV Show' : 'Movie'}`;
  }

  private hasMediaPoster(): boolean {
    return ![
      '/yZec5FxjcNmyKvMsb7Vr3NsWz5r.jpg',
      '/6Adg8Zw4RkuWVvqMEH3CK5EhCDl.jpg',
    ].includes(this.item.poster_path);
  }
}
