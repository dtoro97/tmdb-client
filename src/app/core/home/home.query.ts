import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { HomeState, HomeStore } from './home.store';
import { Observable } from 'rxjs';
import { MoviePopularList200ResponseResultsInner } from '../../api/model/moviePopularList200ResponseResultsInner';
import { TvSeriesAiringTodayList200ResponseResultsInner } from '../../api/model/tvSeriesAiringTodayList200ResponseResultsInner';

@Injectable({ providedIn: 'root' })
export class HomeQuery extends Query<HomeState> {
  trending$: Observable<any[]> = this.select((state) => state.trending);
  popular$: Observable<MoviePopularList200ResponseResultsInner[] | TvSeriesAiringTodayList200ResponseResultsInner[]> = this.select(
    (state) => state.popular
  );
  trendingTime$: Observable<'day' | 'week'> = this.select(
    (state) => state.trendingTime
  );
  popularType$: Observable<string> = this.select((state) => state.popularType);
  constructor(store: HomeStore) {
    super(store);
  }
}
