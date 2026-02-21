import { combineLatest, tap } from 'rxjs';

import { Injectable } from '@angular/core';

import { TmdbRestControllerService } from '../../api/api/tmdb.service';
import { HomeStore } from './home.store';
import { StateService } from '../state';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(
    private store: HomeStore,
    private tmdbApi: TmdbRestControllerService,
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
    const updatePopular = tap((data: { results?: any[] }) =>
      this.store.update({ popular: data.results ?? [] })
    );
    if (type === 'tv') {
      return this.tmdbApi.tvSeriesPopularList().pipe(updatePopular);
    }
    return this.tmdbApi.moviePopularList().pipe(updatePopular);
  }

  fetchTrending(time: 'day' | 'week') {
    return this.tmdbApi.trendingAll(time).pipe(
      tap((data) => this.store.update({ trending: data.results ?? [] }))
    );
  }

  updatePopularType(popularType: string) {
    this.state.setLoading(true);
    this.store.update({ popularType });
    this.fetchPopular(popularType).subscribe(() =>
      this.state.setLoading(false)
    );
  }

  updateTrendingTime(trendingTime: 'day' | 'week') {
    this.state.setLoading(true);
    this.store.update({ trendingTime });
    this.fetchTrending(trendingTime).subscribe(() =>
      this.state.setLoading(false)
    );
  }
}
