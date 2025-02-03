import { MenuItem } from 'primeng/api';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import {
  debounceTime,
  from,
  Observable,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { MultiSearchResult } from 'tmdb-ts';

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';

import { TmdbService } from '../../services';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { StateQuery, StateService } from '../../../core';
import { ImagePipe } from '../../pipes';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    MenubarModule,
    AutoCompleteModule,
    ButtonModule,
    ImagePipe,
    DatePipe,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDarkMode$: Observable<boolean>;
  items: MenuItem[];
  autoCompleteValue: string;
  searchResults: MultiSearchResult[];
  isMobile: Signal<boolean>;
  search$: Observable<string>;
  private _search: Subject<string> = new Subject();
  private _sub: Subscription;

  constructor(
    private tmdb: TmdbService,
    private stateService: StateService,
    private stateQuery: StateQuery,
    private sessionService: StateService
  ) {}

  ngOnInit(): void {
    this.items = this.getMenuItems();
    this.isMobile = this.stateQuery.isMobile;
    this.search$ = this._search.asObservable();
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this._sub = this.search$
      .pipe(
        tap(() => this.stateService.setLoading(true)),
        debounceTime(500),
        switchMap((query) => {
          return from(this.tmdb.search.multi({ query }));
        })
      )
      .subscribe((data) => {
        console.log(data);
        this.stateService.setLoading(false);
        this.searchResults = data.results;
      });
  }
  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('dark');
    this.sessionService.toggleDarkMode();
  }

  search(term: string) {
    this._search.next(term);
  }

  onSearchSelect(value: any, searchBar: AutoComplete) {
    searchBar.clear();
  }

  private getMenuItems(): MenuItem[] {
    return [
      {
        label: 'Home',
        icon: 'fa-solid fa-house',
        routerLink: '/',
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Movies',
        icon: 'fa-solid fa-clapperboard',
        items: [
          {
            label: 'Popular',
            routerLink: '/list/movie',
            queryParams: { sort_by: 'popularity.desc', page: 1 },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Now Playing',
            routerLink: '/list/movie/',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-30),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Upcoming',
            routerLink: '/list/movie/',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-3),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/list/movie',
            queryParams: {
              sort_by: 'vote_average.desc',
              'vote_count.gte': 300,
              page: 1,
            },
          },
        ],
      },
      {
        label: 'TV Shows',
        icon: 'fa-solid fa-tv',
        items: [
          {
            label: 'Popular',
            routerLink: '/list/tv',
            queryParams: { sort_by: 'popularity.desc', page: 1 },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Airing Today',
            routerLink: '/list/tv/',
            queryParams: {
              'first_air_date.gte': this.getSpecificISODate(+0),
              'first_air_date.lte': this.getSpecificISODate(+0),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/list/tv',
            queryParams: {
              sort_by: 'vote_average.desc',
              'vote_count.gte': 300,
              page: 1,
            },
          },
        ],
      },
      {
        label: 'People',
        icon: 'fa-solid fa-user',
        routerLink: '/list/person',
        routerLinkActiveOptions: { exact: false },
      },
    ];
  }

  private getSpecificISODate(daysToAdd: number): string {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return currentDate.toISOString().split('T')[0];
  }
}
