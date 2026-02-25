import { iif, Observable, switchMap, tap } from 'rxjs';

import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import {
  MovieListItem,
  MovieListRestControllerService,
  MultiListItem,
  TrendingRestControllerService,
  TvSeriesListItem,
  TvSeriesListRestControllerService,
} from '../../api';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { loader } from '../../shared';

export type TimeWindow = 'day' | 'week';
export type PopularType = 'tv' | 'movie';

export interface HomeState {
  trending?: MultiListItem[];
  popular?: (MovieListItem | TvSeriesListItem)[];
  trendingTime: TimeWindow;
  popularType: PopularType;
}

@Injectable()
export class HomeStoreService extends ComponentStore<HomeState> {
  popularType$ = this.select((state) => state.popularType);
  trendingTime$ = this.select((state) => state.trendingTime);
  homeVM$ = this.select((state) => ({
    popularType: state.popularType,
    trendingTime: state.trendingTime,
    popular: state.popular ?? [],
    trending: state.trending ?? [],
  }));
  constructor(
    private movieListRestControllerService: MovieListRestControllerService,
    private tvSeriesListRestControllerService: TvSeriesListRestControllerService,
    private trendingRestControllerService: TrendingRestControllerService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {
    super({ trendingTime: 'day', popularType: 'tv' });
    this.getPopularList(this.popularType$);
    this.getTrendingList(this.trendingTime$);
  }

  private readonly getPopularList = this.effect(
    (popularType$: Observable<PopularType>) => {
      return popularType$.pipe(
        switchMap((popularType) =>
          iif(
            () => popularType === 'tv',
            this.tvSeriesListRestControllerService.tvSeriesPopularList(
              undefined,
              undefined,
              undefined,
              undefined,
              {
                httpHeaderAccept: 'application/json',
              },
            ),
            this.movieListRestControllerService.moviePopularList(
              undefined,
              undefined,
              undefined,
              undefined,
              {
                httpHeaderAccept: 'application/json',
              } as never,
            ),
          ).pipe(loader(this.ngxUiLoaderService, 'master')),
        ),
        tap((response) => this.updatePopular(response.results || [])),
      );
    },
  );

  private readonly getTrendingList = this.effect(
    (trendingTime$: Observable<TimeWindow>) =>
      trendingTime$.pipe(
        switchMap((trendingTime) =>
          this.trendingRestControllerService
            .trendingAll(trendingTime, undefined, undefined, {
              httpHeaderAccept: 'application/json',
            } as never)
            .pipe(loader(this.ngxUiLoaderService, 'master')),
        ),

        tap((response) => this.updateTrending(response.results || [])),
      ),
  );

  private updatePopular(popular: (MovieListItem | TvSeriesListItem)[]) {
    this.patchState((state) => ({ ...state, popular }));
  }

  private updateTrending(trending: MultiListItem[]) {
    this.patchState((state) => ({ ...state, trending }));
  }

  updatePopularType(popularType: PopularType) {
    this.patchState((state) => ({ ...state, popularType }));
  }

  updateTrendingTime(trendingTime: TimeWindow) {
    this.patchState((state) => ({ ...state, trendingTime }));
  }
}
