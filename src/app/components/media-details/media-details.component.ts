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
  language$: Observable<string>;
  isMobile$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  breakpointsSmall = CAROUSEL_SM_BREAKPOINTS;
  breakpointsYoutube = CAROUSEL_YT_BREAKPOINTS;
  private routeSubscription: Subscription;
  constructor(
    private route: ActivatedRoute,
    private sessionQuery: SessionQuery,
    private scroler: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.data.subscribe((data) => {
      this.item = data['item'];
      this.cast = data['credits']['cast'];
      this.videos = data['videos']
        .filter((video: any) => video.site === 'YouTube')
        .slice(0, 5);
      this.recommendations = data['recommendations'];
      this.scroler.scrollToPosition([0, 0]);
    });
    this.route.params.subscribe((params) => {
      this.mediaType = params['type'];
    });
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
    this.language$ = combineLatest([
      this.sessionQuery.languages$,
      this.route.params,
      this.route.data,
    ]).pipe(
      map(([languages, params, data]) => {
        return languages.find(
          (lang) =>
            lang['iso_639_1'] ===
            (params['type'] === 'tv'
              ? data['item'].languages[0]
              : data['item'].original_language)
        )?.english_name;
      })
    );
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
