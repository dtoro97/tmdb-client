import { forkJoin, from, Observable, tap } from 'rxjs';
import {
  Genre,
  Movie,
  MovieDiscoverResult,
  TV,
  TvShowDiscoverResult,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';

import { TmdbService } from '../../shared/services/tmdb.service';
import { MediaTypeEnum } from '../../shared/constants/media-type.constants';
import { MAX_LIST_PAGE_SIZE, MAX_PAGES } from '../../constants';
import {
  DiscoverFilterService,
  DiscoverFilters,
} from './discover-filter.service';

export interface DiscoverState {
  fromDate?: Date;
  toDate?: Date;
  page: number;
  sortBy: string;
  genres: string[];
  minVoteCount: number;
  voteAverage: number[];
  rows: number;
  total: number;
  data: (TV | Movie)[];
  tvGenres: Genre[];
  movieGenres: Genre[];
}

@Injectable({ providedIn: 'root' })
export class DiscoverStoreService extends ComponentStore<DiscoverState> {
  readonly skip$ = this.select((state) => state.rows * state.page - 1);
  readonly total$: Observable<number> = this.select((state) => state.total);
  readonly sortBy$: Observable<string> = this.select((state) => state.sortBy);
  readonly voteAverage$: Observable<number[]> = this.select(
    (state) => state.voteAverage,
  );
  readonly minVoteCount$: Observable<number> = this.select(
    (state) => state.minVoteCount,
  );
  readonly genres$: Observable<string[]> = this.select((state) => state.genres);
  readonly fromDate$: Observable<Date | undefined> = this.select(
    (state) => state.fromDate,
  );
  readonly toDate$: Observable<Date | undefined> = this.select(
    (state) => state.toDate,
  );
  readonly data$: Observable<(TV | Movie)[]> = this.select(
    (state) => state.data,
  );
  readonly tvGenres$: Observable<Genre[]> = this.select(
    (state) => state.tvGenres,
  );
  readonly movieGenres$: Observable<Genre[]> = this.select(
    (state) => state.movieGenres,
  );

  constructor(
    private tmdbService: TmdbService,
    private discoverFilterService: DiscoverFilterService,
  ) {
    super({
      page: 1,
      sortBy: 'popularity.desc',
      genres: [],
      voteAverage: [0, 10],
      minVoteCount: 0,
      rows: MAX_LIST_PAGE_SIZE,
      total: 0,
      data: [],
      tvGenres: [],
      movieGenres: [],
    });

    forkJoin({
      tvGenres: from(this.tmdbService.genres.tvShows()),
      movieGenres: from(this.tmdbService.genres.movies()),
    }).subscribe(({ tvGenres, movieGenres }) => {
      this.patchState({
        tvGenres: tvGenres.genres,
        movieGenres: movieGenres.genres,
      });
    });
  }

  fetchData(
    type: string,
    queryParams: Params,
  ): Observable<TvShowDiscoverResult | MovieDiscoverResult> {
    const dataSource$: Observable<TvShowDiscoverResult | MovieDiscoverResult> =
      type === MediaTypeEnum.TV
        ? from(this.tmdbService.discover.tvShow(queryParams))
        : from(this.tmdbService.discover.movie(queryParams));

    return dataSource$.pipe(
      tap((data: TvShowDiscoverResult | MovieDiscoverResult) => {
        this.patchState({
          total:
            data.total_results > MAX_LIST_PAGE_SIZE * MAX_PAGES
              ? MAX_PAGES * MAX_LIST_PAGE_SIZE
              : data.total_results,
          data: data.results as (TV | Movie)[],
        });
      }),
    );
  }

  toQueryParams(type: string): Params {
    return this.discoverFilterService.toQueryParams(this.get(), type);
  }

  toFilters(queryParams: Params, type: string): DiscoverFilters {
    return this.discoverFilterService.toFilters(queryParams, type);
  }

  updateFilters(filters: DiscoverFilters) {
    this.patchState({ ...filters });
  }

  updatePage(page: number) {
    this.patchState({ page });
  }

  updateSortBy(sortBy: string) {
    this.patchState({ sortBy });
  }

  updateFromDate(fromDate: Date | undefined) {
    this.patchState({ fromDate });
  }

  updateToDate(toDate: Date | undefined) {
    this.patchState({ toDate });
  }

  updateGenres(genres: string[]) {
    this.patchState({ genres });
  }

  updateGenreSelection(genreId: number) {
    let genres = [...this.get().genres];
    if (genres.includes(genreId.toString())) {
      genres = genres.filter((g: string) => g !== genreId.toString());
    } else {
      genres.push(genreId.toString());
    }
    this.patchState({ genres });
  }

  updateMinVoteCount(minVoteCount: number) {
    this.patchState({ minVoteCount });
  }

  updateVoteAverage(voteAverage: number[]) {
    this.patchState({ voteAverage });
  }
}
