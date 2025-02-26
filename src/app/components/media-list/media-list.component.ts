import { cloneDeep, get, set, toNumber } from 'lodash';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  Subscription,
  switchMap,
} from 'rxjs';
import { Genre } from 'tmdb-ts';

import { AsyncPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { StateQuery, StateService } from '../../core';
import { TmdbService } from '../../shared';
import { MediaListFilters } from '../../shared/interfaces';
import { CardComponent } from '../card/card.component';
import { movieSortOptions, tvSortOptions } from './sort-options';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-media-list',
  imports: [
    ButtonModule,
    AccordionModule,
    SelectModule,
    DatePickerModule,
    DividerModule,
    ChipModule,
    SliderModule,
    PaginatorModule,
    AsyncPipe,
    CardComponent,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
})
export class MediaListComponent implements OnInit, OnDestroy {
  isMobile: Signal<boolean>;
  type: string;
  sortOptions: any[] = [];
  filters: MediaListFilters;
  total: number = 0;
  skip: number = 0;
  rows: number = 20;
  genres$: Observable<Genre[]>;
  data$: Observable<any[]>;
  title: string;
  filterPanelState$: Observable<boolean>;
  private filterPanelState: BehaviorSubject<boolean>;
  private _data = new BehaviorSubject<any[]>([]);
  private defaultFilters: MediaListFilters = {
    page: 1,
    sortBy: 'popularity.desc',
    genres: [],
    minVoteCount: 0,
  };

  private subs: Subscription[] = [];
  constructor(
    private tmdb: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private stateQuery: StateQuery,
    private titleService: Title,
    private stateService: StateService
  ) {}
  ngOnInit(): void {
    this.isMobile = this.stateQuery.isMobile;
    this.filterPanelState = new BehaviorSubject(!this.stateQuery.isMobile());
    this.filterPanelState$ = this.filterPanelState.asObservable();
    this.data$ = this._data.asObservable();
    this.filters = cloneDeep(this.defaultFilters);
    this.subs.push(
      combineLatest([this.route.queryParams, this.route.params])
        .pipe(
          switchMap(([queryParams, params]) => {
            this.type = params['type'];
            this.genres$ =
              this.type === 'tv'
                ? this.stateQuery.tvGenres$
                : this.stateQuery.movieGenres$;
            this.title = this.getTitle(queryParams, params);
            this.titleService.setTitle(this.title);
            this.sortOptions =
              this.type === 'tv' ? tvSortOptions : movieSortOptions;

            this.filters = this.toFilters(queryParams);

            this.stateService.setLoading(true);

            if (this.type === 'tv') {
              return this.tmdb.discover.tvShow(queryParams);
            } else if (this.type === 'movie') {
              return this.tmdb.discover.movie(queryParams);
            }
            return this.tmdb.people.popular(queryParams);
          })
        )
        .subscribe((data) => {
          this.total = data.total_results;
          this._data.next(data.results);
          this.stateService.setLoading(false);
        })
    );
  }
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  search(): void {
    const queryParams = this.toQueryParams();
    this.router.navigate(['list', this.type], { queryParams });
    if (this.stateQuery.isMobile()) {
      this.filterPanelState.next(false);
    }
  }

  onPageChange(change: any): void {
    this.filters.page = change.page + 1;
    this.skip = change.skip;
    this.search();
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: Genre) {
    if (this.filters.genres.includes(genre.id.toString())) {
      this.filters.genres = this.filters.genres.filter(
        (g: string) => g !== genre.id.toString()
      );
    } else {
      this.filters.genres = [...this.filters.genres, genre.id.toString()];
    }
  }

  isGenreSelected(genre: Genre) {
    return this.filters.genres.includes(genre.id.toString());
  }

  private toQueryParams(): any {
    const queryParams: any = {};
    set(queryParams, 'page', this.filters.page);
    set(queryParams, 'sort_by', this.filters.sortBy);
    if (this.filters.fromDate) {
      queryParams[
        `${this.type === 'tv' ? 'first_air_date' : 'primary_release_date'}.gte`
      ] = this.filters.fromDate.toISOString().split('T')[0];
    }
    if (this.filters.toDate) {
      queryParams[
        `${this.type === 'tv' ? 'first_air_date' : 'primary_release_date'}.lte`
      ] = this.filters.toDate.toISOString().split('T')[0];
    }
    if (this.filters.genres.length > 0) {
      queryParams['with_genres'] = this.filters.genres.join('|');
    }
    if (get(this.filters, 'voteAverage.0')) {
      queryParams['vote_average.gte'] = get(this.filters, 'voteAverage.0');
    }
    if (get(this.filters, 'voteAverage.1')) {
      queryParams['vote_average.lte'] = get(this.filters, 'voteAverage.1');
    }
    if (this.filters.minVoteCount) {
      queryParams['vote_count.gte'] = this.filters.minVoteCount;
    }
    return queryParams;
  }

  private toFilters(queryParams: any): any {
    const filters: any = {};
    let fromDate;
    let toDate;

    if (queryParams.sort_by) {
      set(filters, 'sortBy', queryParams.sort_by);
    }

    if (this.type === 'tv') {
      const from: any = get(queryParams, 'first_air_date.gte');
      const to: any = get(queryParams, 'first_air_date.lte');
      if (this.isValidDate(from)) {
        fromDate = new Date(from);
      }
      if (this.isValidDate(to)) {
        toDate = new Date(to);
      }
    } else if (this.type === 'movie') {
      const from: any = get(queryParams, 'primary_release_date.gte');
      const to: any = get(queryParams, 'primary_release_date.lte');
      if (this.isValidDate(from)) {
        fromDate = new Date(from);
      }
      if (this.isValidDate(to)) {
        toDate = new Date(to);
      }
    }
    if (queryParams.with_genres) {
      set(filters, 'genres', queryParams.with_genres.split('|'));
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
    set(filters, 'page', toNumber(queryParams.page) || 1);
    this.skip = this.rows * filters.page - 1;
    return filters;
  }

  private isValidDate(value: any): boolean {
    return /\d{4}-\d\d-\d\d/.test(value);
  }

  private getTitle(queryParams: any, routeParams: any): string {
    return 'asd';
    /*  switch (true) {
      case routeParams.type === 'person':
        return 'Popular People';
      case routeParams.type === 'tv':
        return 'Browse TV Shows';
      case routeParams.type === 'movie':
        return 'Browse Movies';
      default:
        return '';
    } */
  }
}
