import { Component, OnDestroy, OnInit, viewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LoaderService, TmdbService } from '../../services';
import {
  combineLatest,
  debounce,
  debounceTime,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { AutoComplete } from 'primeng/autocomplete';

@Component({
  selector: 'app-header',
  standalone: false,

  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDarkMode = true;
  items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'fa-solid fa-house',
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
  search$: Observable<string>;
  private _search: Subject<string> = new Subject();
  private _sub: Subscription;

  constructor(
    private tmdbService: TmdbService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.search$ = this._search.asObservable();
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
            type: 'TV Show',
          }));
          const movies = (data[1].results || []).map((movie) => ({
            ...movie,
            type: 'Movie',
          }));
          const people = (data[2].results || []).map((movie) => ({
            ...movie,
            type: 'Person',
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
    this.isDarkMode = !this.isDarkMode;
  }

  search(term: string) {
    this._search.next(term);
  }

  onSearchSelect(value: any, searchBar: AutoComplete) {
    searchBar.clear();
  }
}
