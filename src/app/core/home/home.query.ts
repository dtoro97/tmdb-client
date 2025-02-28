import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { HomeState, HomeStore } from './home.store';
import { Observable } from 'rxjs';
import { Movie, PopularTvShowResult, TimeWindow } from 'tmdb-ts';

@Injectable({ providedIn: 'root' })
export class HomeQuery extends Query<HomeState> {
  trending$: Observable<any[]> = this.select((state) => state.trending);
  popular$: Observable<Movie[] | PopularTvShowResult[]> = this.select(
    (state) => state.popular
  );
  trendingTime$: Observable<TimeWindow> = this.select(
    (state) => state.trendingTime
  );
  popularType$: Observable<string> = this.select((state) => state.popularType);
  constructor(store: HomeStore) {
    super(store);
  }
}
