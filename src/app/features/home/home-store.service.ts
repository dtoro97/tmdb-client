import { combineLatest, from, Observable, tap } from 'rxjs';
import {
  Movie,
  Person,
  PopularTvShowResult,
  TimeWindow,
  TopRatedTvShowResult,
  AiringTodayResult,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { TmdbService } from '../../shared/services/tmdb.service';
import { MediaTypeEnum } from '../../shared/constants/media-type.constants';
import { loader } from '../../shared/utils/loader';

export interface HomeState {
  trending: any[];
  popular: Movie[] | PopularTvShowResult[];
  nowPlaying: Movie[];
  airingToday: AiringTodayResult[];
  upcoming: Movie[];
  topRated: Movie[] | TopRatedTvShowResult[];
  popularPeople: Person[];
  trendingTime: TimeWindow;
  popularType: string;
  topRatedType: string;
}

@Injectable({ providedIn: 'root' })
export class HomeStoreService extends ComponentStore<HomeState> {
  readonly trending$ = this.select((state) => state.trending);
  readonly popular$: Observable<Movie[] | PopularTvShowResult[]> = this.select(
    (state) => state.popular,
  );
  readonly nowPlaying$ = this.select((state) => state.nowPlaying);
  readonly airingToday$ = this.select((state) => state.airingToday);
  readonly upcoming$ = this.select((state) => state.upcoming);
  readonly topRated$: Observable<Movie[] | TopRatedTvShowResult[]> =
    this.select((state) => state.topRated);
  readonly popularPeople$ = this.select((state) => state.popularPeople);
  readonly trendingTime$: Observable<TimeWindow> = this.select(
    (state) => state.trendingTime,
  );
  readonly popularType$: Observable<string> = this.select(
    (state) => state.popularType,
  );
  readonly topRatedType$: Observable<string> = this.select(
    (state) => state.topRatedType,
  );

  constructor(
    private tmdbService: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {
    super({
      trending: [],
      popular: [],
      nowPlaying: [],
      airingToday: [],
      upcoming: [],
      topRated: [],
      popularPeople: [],
      trendingTime: 'day' as TimeWindow,
      popularType: 'tv',
      topRatedType: 'movie',
    });
  }

  init(): Observable<any> {
    const popularType = this.get().popularType;
    const trendingTime = this.get().trendingTime;
    const topRatedType = this.get().topRatedType;
    return combineLatest([
      this.fetchPopular(popularType),
      this.fetchTrending(trendingTime),
      this.fetchNowPlaying(),
      this.fetchAiringToday(),
      this.fetchUpcoming(),
      this.fetchTopRated(topRatedType),
      this.fetchPopularPeople(),
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

  fetchNowPlaying() {
    return from(this.tmdbService.movies.nowPlaying()).pipe(
      tap((data) => this.patchState({ nowPlaying: data.results })),
    );
  }

  fetchAiringToday() {
    return from(this.tmdbService.tvShows.airingToday()).pipe(
      tap((data) => this.patchState({ airingToday: data.results })),
    );
  }

  fetchUpcoming() {
    return from(this.tmdbService.movies.upcoming()).pipe(
      tap((data) => this.patchState({ upcoming: data.results })),
    );
  }

  fetchTopRated(type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.topRated()
        : this.tmdbService.movies.topRated(),
    ).pipe(tap((data) => this.patchState({ topRated: data.results })));
  }

  fetchPopularPeople() {
    return from(this.tmdbService.people.popular()).pipe(
      tap((data) => this.patchState({ popularPeople: data.results })),
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

  updateTopRatedType(topRatedType: string) {
    this.patchState({ topRatedType });
    this.fetchTopRated(topRatedType)
      .pipe(loader(this.ngxUiLoaderService, 'master'))
      .subscribe();
  }
}
