import { debounceTime, EMPTY, iif, Observable, switchMap, tap } from 'rxjs';

import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { getQueryParam, mapFilterOptionsToQueryParams } from '../../shared';
import { MAX_LIST_PAGE_SIZE, MAX_PAGES } from '../../constants';
import { ComponentStore } from '@ngrx/component-store';
import {
  DiscoverRestControllerService,
  GenreRestControllerService,
  ItemWithNameAndId,
  MovieListItem,
  MoviePage,
  PersonListItem,
  PersonListRestControllerService,
  PersonPage,
  TvSeriesListItem,
  TvSeriesPage,
} from '../../api';

export interface MediaListStoreState {
  filterOptions: MediaListStoreFilterOptions;
  total: number;
  data: (TvSeriesListItem | MovieListItem | PersonListItem)[];
  genres: ItemWithNameAndId[];
}

export type MediaType = 'tv' | 'movie';

export type MediaListStoreFilterOptions = {
  sortBy?: string;
  fromDate?: string;
  toDate?: string;
  withGenres?: string[];
  minVoteCount?: number;
  voteAverage?: number[];
  page: number;
  size: number;
  type: MediaType;
};

const getFilterOptionsFromQueryParams = () => {
  return {
    sortBy: getQueryParam('sortBy') || undefined,
    fromDate: getQueryParam('fromDate') || undefined,
    toDate: getQueryParam('toDate') || undefined,
    withGenres: getQueryParam('withGenres')?.split(',') || undefined,
    minVoteCount: Number(getQueryParam('minVoteCount')) || 0,
    voteAverage: getQueryParam('voteAverage')
      ?.split(',')
      .map((a) => Number(a)) || [0, 10],
    page: Number(getQueryParam('page')) || 0,
    size: Number(getQueryParam('size')) || 20,
    type: (getQueryParam('type') || 'tv') as MediaType,
  };
};

@Injectable({ providedIn: 'root' })
export class MediaListStoreService extends ComponentStore<MediaListStoreState> {
  filterOptions$ = this.select((state) => state.filterOptions);
  genres$ = this.select((state) => state.genres);
  data$ = this.select((state) => state.data);
  total$ = this.select((state) => state.total);
  skip$ = this.select((state) => state.filterOptions.page * 20 - 1);

  constructor(
    private discoverRestControllerService: DiscoverRestControllerService,
    private personListRestControllerService: PersonListRestControllerService,
    private genreRestControllerService: GenreRestControllerService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    super({
      data: [],
      total: 0,
      filterOptions: getFilterOptionsFromQueryParams(),
      genres: [],
    });
    this.getData(this.filterOptions$);
    this.getGenres(this.filterOptions$);
  }

  startGettingData() {
    this.getData(this.getData$);
  }

  private readonly getData$ = this.select(
    this.filterOptions$.pipe(debounceTime(500)),
    (filterOptions) => {
      return filterOptions;
    },
    { debounce: true },
  );

  private readonly getGenres = this.effect(
    (filterOptions$: Observable<MediaListStoreFilterOptions>) => {
      return filterOptions$.pipe(
        switchMap((filterOptions) =>
          iif(
            () => filterOptions.type === 'tv',
            this.genreRestControllerService.genreMovieList(
              undefined,
              undefined,
              undefined,
              {
                httpHeaderAccept: 'application/json',
              },
            ),
            this.genreRestControllerService.genreTvList(
              undefined,
              undefined,
              undefined,
              {
                httpHeaderAccept: 'application/json',
              },
            ),
          ).pipe(tap((data) => this.patchState({ genres: data.genres || [] }))),
        ),
      );
    },
  );

  private readonly getData = this.effect(
    (filterOptions$: Observable<MediaListStoreFilterOptions>) => {
      return filterOptions$.pipe(
        tap((filterOptions) => {
          if (this.get().data && this.get().data.length > 0) {
            this.router.navigate([], {
              relativeTo: this.activatedRoute,
              queryParams: mapFilterOptionsToQueryParams(filterOptions),
            });
          }
        }),
        switchMap((filterOptions) =>
          iif(
            () => filterOptions.type === 'tv',
            this.discoverRestControllerService
              .discoverTv(
                undefined,
                undefined,
                undefined,
                filterOptions.fromDate,
                filterOptions.toDate,
                undefined,
                undefined,
                undefined,
                filterOptions.page,
                undefined,
                filterOptions.sortBy as any,
                undefined,
                filterOptions.voteAverage
                  ? filterOptions.voteAverage[0]
                  : undefined,
                filterOptions.voteAverage
                  ? filterOptions.voteAverage[1]
                  : undefined,
                filterOptions.minVoteCount,
                undefined,
                undefined,
                undefined,
                filterOptions.withGenres?.join(','),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                {
                  httpHeaderAccept: 'application/json',
                },
              )
              .pipe(tap({ next: (data) => this.updateData(data) })),
            EMPTY,
          ),
        ),
      );
    },
  );
  updateData(data: PersonPage | MoviePage | TvSeriesPage) {
    this.patchState({
      total:
        (data.total_results ?? 0 > MAX_LIST_PAGE_SIZE * MAX_PAGES)
          ? MAX_PAGES * MAX_LIST_PAGE_SIZE
          : data.total_results,
      data: data.results,
    });
  }
  updatePage(page: number) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, page },
    }));
  }
  updateSortBy(sortBy: string) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, sortBy },
    }));
  }
  updateFromDate(fromDate: string | undefined) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, fromDate },
    }));
  }
  updateToDate(toDate: string | undefined) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, toDate },
    }));
  }
  updateGenres(genres: string[]) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, genres },
    }));
  }
  updateGenreSelection(genreId: number) {
    const storeGenres = this.get().filterOptions.withGenres || [];
    let genres = [...storeGenres];
    if (genres.includes(genreId.toString())) {
      genres = genres.filter((g: string) => g !== genreId.toString());
    } else {
      genres.push(genreId.toString());
    }
    this.updateGenres(genres);
  }
  updateMinVoteCount(minVoteCount: number) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, minVoteCount },
    }));
  }
  updateVoteAverage(voteAverage: number[]) {
    this.patchState((state) => ({
      ...state,
      filterOptions: { ...state.filterOptions, voteAverage },
    }));
  }
}
