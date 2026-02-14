import { combineLatest, from, Observable, tap } from 'rxjs';
import { Movie, PopularTvShowResult, TimeWindow } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { TmdbService } from '../../shared/services/tmdb.service';
import { MediaTypeEnum } from '../../shared/constants/media-type.constants';
import { loader } from '../../shared/utils/loader';

export interface HomeState {
  trending: any[];
  popular: Movie[] | PopularTvShowResult[];
  trendingTime: TimeWindow;
  popularType: string;
}

@Injectable({ providedIn: 'root' })
export class HomeStoreService extends ComponentStore<HomeState> {
  readonly trending$ = this.select((state) => state.trending);
  readonly popular$: Observable<Movie[] | PopularTvShowResult[]> = this.select(
    (state) => state.popular,
  );
  readonly trendingTime$: Observable<TimeWindow> = this.select(
    (state) => state.trendingTime,
  );
  readonly popularType$: Observable<string> = this.select(
    (state) => state.popularType,
  );

  constructor(
    private tmdbService: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {
    super({
      trending: [],
      popular: [],
      trendingTime: 'day' as TimeWindow,
      popularType: 'tv',
    });
  }

  init(): Observable<any> {
    const popularType = this.get().popularType;
    const trendingTime = this.get().trendingTime;
    return combineLatest([
      this.fetchPopular(popularType),
      this.fetchTrending(trendingTime),
    ]);
  }

  fetchPopular(type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.popular()
        : this.tmdbService.movies.popular(),
    ).pipe(tap((data) => this.patchState({ popular: data.results })));
  }

  fetchTrending(time: TimeWindow) {
    return from(this.tmdbService.trending.trending('all', time)).pipe(
      tap((data) => this.patchState({ trending: data.results })),
    );
  }

  updatePopularType(popularType: string) {
    this.patchState({ popularType });
    this.fetchPopular(popularType)
      .pipe(loader(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }

  updateTrendingTime(trendingTime: TimeWindow) {
    this.patchState({ trendingTime });
    this.fetchTrending(trendingTime)
      .pipe(loader(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }
}
