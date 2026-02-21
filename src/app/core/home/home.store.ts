import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { MoviePopularList200ResponseResultsInner } from '../../api/model/moviePopularList200ResponseResultsInner';
import { TvSeriesAiringTodayList200ResponseResultsInner } from '../../api/model/tvSeriesAiringTodayList200ResponseResultsInner';

export interface HomeState {
  trending: any[];
  popular: MoviePopularList200ResponseResultsInner[] | TvSeriesAiringTodayList200ResponseResultsInner[];
  trendingTime: 'day' | 'week';
  popularType: string;
}

function createInitialState(): HomeState {
  return {
    trending: [],
    popular: [],
    trendingTime: 'day',
    popularType: 'tv',
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'home' })
export class HomeStore extends Store<HomeState> {
  constructor() {
    super(createInitialState());
  }
}
