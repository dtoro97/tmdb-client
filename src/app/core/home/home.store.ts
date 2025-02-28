import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Movie, PopularTvShowResult, TimeWindow } from 'tmdb-ts';

export interface HomeState {
  trending: any[];
  popular: Movie[] | PopularTvShowResult[];
  trendingTime: TimeWindow;
  popularType: string;
}

function createInitialState(): HomeState {
  return {
    trending: [],
    popular: [],
    trendingTime: 'day' as TimeWindow,
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
