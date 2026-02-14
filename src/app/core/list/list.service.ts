import { from, Observable, tap } from 'rxjs';
import {
  MovieDiscoverResult,
  PopularPeople,
  TvShowDiscoverResult,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';

import { MediaListFilters, MediaType, TmdbService } from '../../shared';
import { FilterQueryConverter } from '../../shared/helpers/filter-query-converter';
import { ListStore } from './list.store';
import { MAX_LIST_PAGE_SIZE, MAX_PAGES } from '../../constants';

@Injectable({ providedIn: 'root' })
export class ListService {
  constructor(
    private store: ListStore,
    private tmdbService: TmdbService,
    private router: Router
  ) {}

  fetchData(
    type: string,
    queryParams: Params
  ): Observable<TvShowDiscoverResult | MovieDiscoverResult | PopularPeople> {
    let dataSource$: Observable<TvShowDiscoverResult | MovieDiscoverResult | PopularPeople>;
    if (type === MediaType.TV) {
      dataSource$ = from(this.tmdbService.discover.tvShow(queryParams));
    } else if (type === MediaType.MOVIE) {
      dataSource$ = from(this.tmdbService.discover.movie(queryParams));
    } else {
      dataSource$ = from(this.tmdbService.people.popular(queryParams));
    }
    return dataSource$.pipe(
      tap((data) => {
        this.updateData(data);
      })
    );
  }

  toQueryParams(type: string): any {
    const filters = this.store.getValue();
    return FilterQueryConverter.toQueryParams(filters, type);
  }

  toFilters(queryParams: Params, type: string): MediaListFilters {
    return FilterQueryConverter.toFilters(queryParams, type);
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
