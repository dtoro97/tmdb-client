import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LoaderService, TmdbService } from '../../services';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  Subscription,
  switchMap,
} from 'rxjs';
import { SessionQuery } from '../../state/session.query';
import { get, set, toNumber, cloneDeep } from 'lodash';
import { movieSortOptions, tvSortOptions } from './sort-options';
import { IGenre } from '../../interfaces';
import { ViewportScroller } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-media-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
})
export class MediaListComponent implements OnInit, OnDestroy {
  isMobile$: Observable<boolean>;
  type: string;
  sortOptions: any[] = [];
  filters: any = {};
  total: number = 0;
  skip: number = 0;
  rows: number = 20;
  genres$: Observable<IGenre[]>;
  data$: Observable<any[]>;
  title: string;
  private _data = new BehaviorSubject([]);
  private defaultFilters: any = {
    fromDate: null,
    toDate: null,
    page: 1,
    sortBy: 'popularity.desc',
    genres: [],
    minVoteCount: 0,
  };

  private subs: Subscription[] = [];
  constructor(
    private loader: LoaderService,
    private tmdbService: TmdbService,
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private sessionQuery: SessionQuery,
    private titleService: Title
  ) {}
  ngOnInit(): void {
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.data$ = this._data.asObservable();
    this.filters = cloneDeep(this.defaultFilters);
    this.subs.push(
      combineLatest([this.route.queryParams, this.route.params])
        .pipe(
          switchMap(([queryParams, params]) => {
            this.type = params['type'];
            this.genres$ =
              this.type === 'tv'
                ? this.sessionQuery.tvGenres$
                : this.sessionQuery.movieGenres$;
            this.title = this.getTitle(queryParams, params);
            this.titleService.setTitle(this.title);
            this.sortOptions =
              this.type === 'tv' ? tvSortOptions : movieSortOptions;

            this.filters = this.toFilters(queryParams);

            this.loader.setLoading(true);
            return this.tmdbService.discover(this.type, queryParams);
          })
        )
        .subscribe((data) => {
          this.total = data.total_results;
          this._data.next(data.results);
          this.loader.setLoading(false);
        })
    );
  }
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  search(): void {
    const queryParams = this.toQueryParams();
    this.router.navigate([`list/${this.type}`], { queryParams });
  }

  onPageChange(change: any): void {
    this.filters.page = change.page + 1;
    this.search();
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: IGenre) {
    if (this.filters.genres.includes(genre.id.toString())) {
      this.filters.genres = this.filters.genres.filter(
        (g: string) => g !== genre.id.toString()
      );
    } else {
      this.filters.genres = [...this.filters.genres, genre.id.toString()];
    }
  }

  isGenreSelected(genre: IGenre) {
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
      queryParams['with_genres'] = this.filters.genres.join(',');
    }
    if (this.filters.voteAverage[0]) {
      queryParams['vote_average.gte'] = this.filters.voteAverage[0];
    }
    if (this.filters.voteAverage[1]) {
      queryParams['vote_average.lte'] = this.filters.voteAverage[1];
    }
    if (this.filters.minVoteCount) {
      queryParams['vote_count.gte'] = this.filters.minVoteCount[0];
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
      set(filters, 'genres', queryParams.with_genres.split(','));
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
    set(filters, 'page', toNumber(queryParams.page));
    this.skip = this.rows * filters.page - 1;
    return filters;
  }

  private isValidDate(value: any): boolean {
    return /\d{4}-\d\d-\d\d/.test(value);
  }

  private getTitle(queryParams: any, routeParams: any): string {
    switch (true) {
      case routeParams.type === 'person':
        return 'Popular Person';
      case routeParams.type === 'tv':
        return 'Browse TV Shows';
      case routeParams.type === 'movie':
        return 'Browse Movies';
      default:
        return '';
    }
  }
}
