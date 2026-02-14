import { from, Observable, tap } from 'rxjs';
import { Person, PopularPeople } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';

import { TmdbService } from '../../shared/services/tmdb.service';
import { MAX_LIST_PAGE_SIZE, MAX_PAGES } from '../../constants';

export interface PeopleListState {
  page: number;
  total: number;
  data: Person[];
  rows: number;
}

@Injectable({ providedIn: 'root' })
export class PeopleListStoreService extends ComponentStore<PeopleListState> {
  readonly data$: Observable<Person[]> = this.select((state) => state.data);
  readonly total$: Observable<number> = this.select((state) => state.total);
  readonly skip$: Observable<number> = this.select(
    (state) => state.rows * state.page - 1,
  );

  constructor(private tmdbService: TmdbService) {
    super({
      page: 1,
      total: 0,
      data: [],
      rows: MAX_LIST_PAGE_SIZE,
    });
  }

  fetchPopularPeople(queryParams: Params): Observable<PopularPeople> {
    return from(this.tmdbService.people.popular(queryParams)).pipe(
      tap((data) => {
        this.patchState({
          total:
            data.total_results > MAX_LIST_PAGE_SIZE * MAX_PAGES
              ? MAX_PAGES * MAX_LIST_PAGE_SIZE
              : data.total_results,
          data: data.results,
        });
      }),
    );
  }

  updatePage(page: number) {
    this.patchState({ page });
  }
}
