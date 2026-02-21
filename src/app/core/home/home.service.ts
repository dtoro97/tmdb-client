import { combineLatest, from, tap } from 'rxjs';
import { TimeWindow } from 'tmdb-ts';

import { Injectable } from '@angular/core';

import { TmdbService } from '../../shared';
import { HomeStore } from './home.store';
import { StateService } from '../state';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(
    private store: HomeStore,
    private tmdbService: TmdbService,
    private state: StateService
  ) {}

  init() {
    const popularType = this.store.getValue().popularType;
    const trendingTime = this.store.getValue().trendingTime;
    this.state.setLoading(true);
    combineLatest([
      this.fetchPopular(popularType),
      this.fetchTrending(trendingTime),
    ]).subscribe(() => this.state.setLoading(false));
  }

  fetchPopular(type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.popular()
        : this.tmdbService.movies.popular()
    ).pipe(tap((data) => this.store.update({ popular: data.results })));
  }

  fetchTrending(time: TimeWindow) {
    return from(this.tmdbService.trending.trending('all', time)).pipe(
      tap((data) => this.store.update({ trending: data.results }))
    );
  }

  updatePopularType(popularType: string) {
    this.state.setLoading(true);
    this.store.update({ popularType });
    this.fetchPopular(popularType).subscribe(() =>
      this.state.setLoading(false)
    );
  }

  updateTrendingTime(trendingTime: TimeWindow) {
    this.state.setLoading(true);
    this.store.update({ trendingTime });
    this.fetchTrending(trendingTime).subscribe(() =>
      this.state.setLoading(false)
    );
  }
}
