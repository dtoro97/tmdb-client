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
  items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'fa-solid fa-house',
      routerLink: '/',
    },
    {
      label: 'Movies',
      icon: 'fa-solid fa-clapperboard',
    },
    {
      label: 'TV Shows',
      icon: 'fa-solid fa-tv',
    },
    {
      label: 'People',
      icon: 'fa-solid fa-user',
    },
  ];
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
}
