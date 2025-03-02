import { get, set, toNumber } from 'lodash';
import { from, Observable, tap } from 'rxjs';
import {
  MovieDiscoverResult,
  PopularPeople,
  TvShowDiscoverResult,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';

import { isValidDate, MediaListFilters, TmdbService } from '../../shared';
import { StateService } from '../state';
import { ListStore } from './list.store';
import { MAX_LIST_PAGE_SIZE, MAX_PAGES } from '../../constants';

@Injectable({ providedIn: 'root' })
export class ListService {
  constructor(
    private store: ListStore,
    private tmdbService: TmdbService,
    private router: Router,
    private state: StateService
  ) {}

  fetchData(
    type: string,
    queryParams: Params
  ): Observable<TvShowDiscoverResult | MovieDiscoverResult | PopularPeople> {
    let dataSource$: Observable<any>;
    if (type === 'tv') {
      dataSource$ = from(this.tmdbService.discover.tvShow(queryParams));
    } else if (type === 'movie') {
      dataSource$ = from(this.tmdbService.discover.movie(queryParams));
    }
    dataSource$ = from(this.tmdbService.people.popular(queryParams));
    return dataSource$.pipe(
      tap((data) => {
        this.updateData(data);
        this.state.setLoading(false);
      })
    );
  }

  toQueryParams(type: string): any {
    const store = this.store.getValue();
    const queryParams: Record<string, any> = {};
    queryParams['page'] = store.page;
    queryParams['sort_by'] = store.sortBy;

    if (store.fromDate) {
      queryParams[
        `${type === 'tv' ? 'first_air_date' : 'primary_release_date'}.gte`
      ] = store.fromDate.toISOString().split('T')[0];
    }
    if (store.toDate) {
      queryParams[
        `${type === 'tv' ? 'first_air_date' : 'primary_release_date'}.lte`
      ] = store.toDate.toISOString().split('T')[0];
    }
    if (store.genres.length > 0) {
      queryParams['with_genres'] = store.genres.join('|');
    }
    if (get(store, 'voteAverage.0')) {
      queryParams['vote_average.gte'] = get(store, 'voteAverage.0');
    }
    if (get(store, 'voteAverage.1')) {
      queryParams['vote_average.lte'] = get(store, 'voteAverage.1');
    }
    if (store.minVoteCount) {
      queryParams['vote_count.gte'] = store.minVoteCount;
    }
    return queryParams;
  }

  toFilters(queryParams: Params, type: string): MediaListFilters {
    const filters = {};
    let fromDate;
    let toDate;

    if (queryParams['sort_by']) {
      set(filters, 'sortBy', queryParams['sort_by']);
    }

    if (type === 'tv') {
      const from: any = get(queryParams, 'first_air_date.gte');
      const to: any = get(queryParams, 'first_air_date.lte');
      if (isValidDate(from)) {
        fromDate = new Date(from);
      }
      if (isValidDate(to)) {
        toDate = new Date(to);
      }
    } else if (type === 'movie') {
      const from: any = get(queryParams, 'primary_release_date.gte');
      const to: any = get(queryParams, 'primary_release_date.lte');
      if (isValidDate(from)) {
        fromDate = new Date(from);
      }
      if (isValidDate(to)) {
        toDate = new Date(to);
      }
    }
    if (queryParams['with_genres']) {
      set(filters, 'genres', queryParams['with_genres'].split('|'));
    } else {
      set(filters, 'genres', []);
    }

    if (get(queryParams, 'vote_average.gte')) {
      set(filters, 'voteAverage.0', toNumber(queryParams['vote_average.gte']));
    } else {
      set(filters, 'voteAverage.0', 0);
    }
    if (get(queryParams, 'vote_average.lte')) {
      set(filters, 'voteAverage.1', toNumber(queryParams['vote_average.lte']));
    } else {
      set(filters, 'voteAverage.1', 10);
    }
    if (get(queryParams, 'vote_count.gte')) {
      set(filters, 'minVoteCount', toNumber(queryParams['vote_count.gte']));
    }

    set(filters, 'fromDate', fromDate);
    set(filters, 'toDate', toDate);
    set(filters, 'page', toNumber(queryParams['page']) || 1);

    return filters as MediaListFilters;
  }

  updateFilters(filters: MediaListFilters) {
    this.store.update({ ...filters });
  }

  updateData(data: PopularPeople | MovieDiscoverResult | TvShowDiscoverResult) {
    this.store.update({
      total:
        data.total_results > MAX_LIST_PAGE_SIZE * MAX_PAGES
          ? MAX_PAGES * MAX_LIST_PAGE_SIZE
          : data.total_results,
      data: data.results,
    });
  }
  updatePage(page: number) {
    this.store.update({ page });
  }
  updateSortBy(sortBy: string) {
    this.store.update({ sortBy });
  }
  updateFromDate(fromDate: Date | undefined) {
    this.store.update({ fromDate });
  }
  updateToDate(toDate: Date | undefined) {
    this.store.update({ toDate });
  }
  updateGenres(genres: string[]) {
    this.store.update({ genres });
  }
  updateGenreSelection(genreId: number) {
    let genres = [...this.store.getValue().genres];
    if (genres.includes(genreId.toString())) {
      genres = genres.filter((g: string) => g !== genreId.toString());
    } else {
      genres.push(genreId.toString());
    }
    this.store.update({ genres });
  }
  updateMinVoteCount(minVoteCount: number) {
    this.store.update({ minVoteCount });
  }
  updateVoteAverage(voteAverage: number[]) {
    this.store.update({ voteAverage });
  }
}
