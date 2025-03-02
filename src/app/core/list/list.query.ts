import { map, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { MediaListFilters } from '../../shared';
import { ListState, ListStore } from './list.store';

@Injectable({ providedIn: 'root' })
export class ListQuery extends Query<ListState> {
  skip$: Observable<number> = this.select(
    (state) => state.rows * state.page - 1
  );
  rows$: Observable<number> = this.select((state) => state.rows);
  total$: Observable<number> = this.select((state) => state.total);
  sortBy$: Observable<string> = this.select((state) => state.sortBy);
  page$: Observable<number> = this.select((state) => state.page);
  voteAverage$: Observable<number[]> = this.select(
    (state) => state.voteAverage
  );
  minVoteCount$: Observable<number> = this.select(
    (state) => state.minVoteCount
  );
  genres$: Observable<string[]> = this.select((state) => state.genres);
  fromDate$: Observable<Date | undefined> = this.select(
    (state) => state.fromDate
  );
  toDate$: Observable<Date | undefined> = this.select((state) => state.toDate);
  data$: Observable<any[]> = this.select((state) => state.data);
  constructor(store: ListStore) {
    super(store);
  }
}
