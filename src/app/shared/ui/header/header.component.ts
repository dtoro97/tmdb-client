import { MenuItem } from 'primeng/api';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { debounceTime, from, Observable, Subject, switchMap, tap } from 'rxjs';
import { MultiSearchResult } from 'tmdb-ts';

import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';

import { TmdbService } from '../../services';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { GlobalStore } from '../../../core/global.store';
import { loader } from '../../utils/loader';
import { ImagePipe } from '../../pipes';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DateHelper } from '../../utils/date.helper';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [
    MenubarModule,
    AutoCompleteModule,
    ButtonModule,
    ImagePipe,
    DatePipe,
    RouterLink,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isDarkMode$: Observable<boolean>;
  items: MenuItem[];
  autoCompleteValue: string;
  isMobile: Signal<boolean>;
  search$: Observable<string>;
  searchResults$: Observable<MultiSearchResult[]>;
  private _searchResults: Subject<MultiSearchResult[]> = new Subject();
  private _search: Subject<string> = new Subject();

  constructor(
    private globalStore: GlobalStore,
    private tmdb: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {
    this.items = this.getMenuItems();
    this.isMobile = this.globalStore.isMobile;
    this.search$ = this._search.asObservable();
    this.searchResults$ = this._searchResults.asObservable();
    this.isDarkMode$ = this.globalStore.isDarkMode$;
    this.search$
      .pipe(
        takeUntilDestroyed(),
        debounceTime(500),
        switchMap((query) =>
          from(this.tmdb.search.multi({ query })).pipe(
            loader(this.ngxUiLoaderService, 'master'),
          ),
        ),
        tap((data) => this._searchResults.next(data.results)),
      )
      .subscribe();
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('dark');
    this.globalStore.toggleDarkMode();
  }

  search(term: string) {
    this._search.next(term);
  }

  onSearchSelect(searchBar: AutoComplete) {
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
            routerLink: '/discover/movie',
            queryParams: { sort_by: 'popularity.desc', page: 1 },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Now Playing',
            routerLink: '/discover/movie',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-30),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Upcoming',
            routerLink: '/discover/movie',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-3),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/discover/movie',
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
            routerLink: '/discover/tv',
            queryParams: { sort_by: 'popularity.desc', page: 1 },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Airing Today',
            routerLink: '/discover/tv',
            queryParams: {
              'first_air_date.gte': this.getSpecificISODate(+0),
              'first_air_date.lte': this.getSpecificISODate(+0),
              sort_by: 'popularity.desc',
              page: 1,
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/discover/tv',
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
        routerLink: '/people',
        routerLinkActiveOptions: { exact: false },
      },
    ];
  }

  private getSpecificISODate(daysToAdd: number): string {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return DateHelper.formatToISO(currentDate);
  }
}
