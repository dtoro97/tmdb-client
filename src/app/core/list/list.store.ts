import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { MAX_LIST_PAGE_SIZE } from '../../constants';
import {
  DiscoverMovie200ResponseResultsInner,
  DiscoverTv200ResponseResultsInner,
  PersonPopularList200Response,
  PersonPopularList200ResponseResultsInner,
} from '../../api';
export interface ListState {
  fromDate?: Date;
  toDate?: Date;
  page: number;
  sortBy: string;
  genres: string[];
  minVoteCount: number;
  voteAverage: number[];
  rows: number;
  total: number;
  data: (
    | DiscoverTv200ResponseResultsInner
    | DiscoverMovie200ResponseResultsInner
    | PersonPopularList200ResponseResultsInner
  )[];
}

function createInitialState(): ListState {
  return {
    page: 1,
    sortBy: 'popularity.desc',
    genres: [],
    voteAverage: [0, 10],
    minVoteCount: 0,
    rows: MAX_LIST_PAGE_SIZE,
    total: 0,
    data: [],
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'list' })
export class ListStore extends Store<ListState> {
  constructor() {
    super(createInitialState());
  }
}
