import { MenuItem } from 'primeng/api';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { debounceTime, Observable, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { ImagePipe } from '../../pipes';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MultiListItem, SearchRestControllerService } from '../../../api';
import { ConfigStoreService } from '../../services';

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
  isDarkMode$ = this.configStoreService.isDarkMode$;
  items: MenuItem[];
  autoCompleteValue: string;
  search$: Observable<string>;
  searchResults$: Observable<MultiListItem[]>;
  private _searchResults: Subject<MultiListItem[]> = new Subject();
  private _search: Subject<string> = new Subject();

  constructor(
    private searchRestControllerService: SearchRestControllerService,
    private configStoreService: ConfigStoreService,
  ) {
    this.items = this.getMenuItems();
    this.search$ = this._search.asObservable();
    this.searchResults$ = this._searchResults.asObservable();
    this.search$
      .pipe(
        takeUntilDestroyed(),
        debounceTime(500),
        switchMap((query) => {
          return this.searchRestControllerService.searchMulti(
            query,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { httpHeaderAccept: 'application/json' },
          );
        }),
      )
      .subscribe((data) => {
        this._searchResults.next(data.results || []);
      });
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('dark');
    this.configStoreService.toggleDarkMode();
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
            routerLink: '/discover',
            queryParams: { sortBy: 'popularity.desc', page: 1, type: 'movie' },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Now Playing',
            routerLink: '/discover',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-30),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sortBy: 'popularity.desc',
              page: 1,
              type: 'movie',
            },
          },
          {
            label: 'Upcoming',
            routerLink: '/discover',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-3),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sortBy: 'popularity.desc',
              page: 1,
              type: 'movie',
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: {
              sortBy: 'vote_average.desc',
              'vote_count.gte': 300,
              page: 1,
              type: 'movie',
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
            routerLink: '/discover',
            queryParams: { sortBy: 'popularity.desc', page: 1, type: 'tv' },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Airing Today',
            routerLink: '/discover',
            queryParams: {
              'first_air_date.gte': this.getSpecificISODate(+0),
              'first_air_date.lte': this.getSpecificISODate(+0),
              sortBy: 'popularity.desc',
              page: 1,
              type: 'tv',
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: {
              sortBy: 'vote_average.desc',
              'vote_count.gte': 300,
              page: 1,
              type: 'tv',
            },
          },
        ],
      },
      {
        label: 'People',
        icon: 'fa-solid fa-user',
        routerLink: '/discover/person',
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
