import { combineLatest, from, tap } from 'rxjs';
import { TimeWindow } from 'tmdb-ts';

import { Injectable } from '@angular/core';

import { MediaType, TmdbService, spinner } from '../../shared';
import { HomeStore } from './home.store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(
    private store: HomeStore,
    private tmdbService: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {}

  init() {
    const popularType = this.store.getValue().popularType;
    const trendingTime = this.store.getValue().trendingTime;
    combineLatest([
      this.fetchPopular(popularType),
      this.fetchTrending(trendingTime),
    ])
      .pipe(spinner(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }

  fetchPopular(type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.popular()
        : this.tmdbService.movies.popular(),
    ).pipe(tap((data) => this.store.update({ popular: data.results })));
  }

  fetchTrending(time: TimeWindow) {
    return from(this.tmdbService.trending.trending('all', time)).pipe(
      tap((data) => this.store.update({ trending: data.results })),
    );
  }

  updatePopularType(popularType: string) {
    this.store.update({ popularType });
    this.fetchPopular(popularType)
      .pipe(spinner(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }

  updateTrendingTime(trendingTime: TimeWindow) {
    this.store.update({ trendingTime });
    this.fetchTrending(trendingTime)
      .pipe(spinner(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }
}
