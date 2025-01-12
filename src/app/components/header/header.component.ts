import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LoaderService, TmdbService } from '../../services';
import {
  combineLatest,
  debounceTime,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { AutoComplete } from 'primeng/autocomplete';
import { SessionQuery } from '../../state/session.query';
import { SessionService } from '../../state/session.service';

@Component({
  selector: 'app-header',
  standalone: false,

  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDarkMode$: Observable<boolean>;
  items: MenuItem[];
  autoCompleteValue: string;
  searchResults: any[];
  isMobile$: Observable<boolean>;
  search$: Observable<string>;
  private _search: Subject<string> = new Subject();
  private _sub: Subscription;

  constructor(
    private tmdbService: TmdbService,
    private loaderService: LoaderService,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.items = this.getMenuItems();
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.search$ = this._search.asObservable();
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
    this._sub = this.search$
      .pipe(
        tap(() => this.loaderService.setLoading(true)),
        debounceTime(500),
        switchMap((term) => {
          return combineLatest([
            this.tmdbService.search('tv', term),
            this.tmdbService.search('movie', term),
            this.tmdbService.search('person', term),
          ]);
        }),
        map((data) => {
          const tv = (data[0].results || []).map((show) => ({
            ...show,
            type: 'tv',
          }));
          const movies = (data[1].results || []).map((movie) => ({
            ...movie,
            type: 'movie',
          }));
          const people = (data[2].results || []).map((movie) => ({
            ...movie,
            type: 'person',
          }));
          return tv.concat(movies).concat(people);
        })
      )
      .subscribe((data) => {
        this.loaderService.setLoading(false);
        this.searchResults = data;
        console.log(this.searchResults);
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
            queryParams: { sort_by: 'popularity.desc' },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Now Playing',
            routerLink: '/list/movie/',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-30),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
            },
          },
          {
            label: 'Upcoming',
            routerLink: '/list/movie/',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(-3),
              'primary_release_date.lte': this.getSpecificISODate(+7),
              sort_by: 'popularity.desc',
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/list/movie',
            queryParams: {
              sort_by: 'vote_average.desc',
              'vote_count.gte': 300,
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
            queryParams: { sort_by: 'popularity.desc' },
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Airing Today',
            routerLink: '/list/movie/',
            queryParams: {
              'primary_release_date.gte': this.getSpecificISODate(+0),
              'primary_release_date.lte': this.getSpecificISODate(+0),
              sort_by: 'popularity.desc',
            },
          },
          {
            label: 'Top Rated',
            routerLink: '/list/tv',
            queryParams: {
              sort_by: 'vote_average.desc',
              'vote_count.gte': 300,
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
