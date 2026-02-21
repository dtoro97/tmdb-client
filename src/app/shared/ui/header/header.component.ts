import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { debounceTime, from, Observable, Subject, switchMap, tap } from 'rxjs';
import { MultiSearchResult } from 'tmdb-ts';

import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Signal,
} from '@angular/core';

import { TmdbService } from '../../services';
import { GlobalStore } from '../../../core/global.store';
import { loader } from '../../utils/loader';
import { ImagePipe } from '../../pipes';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DateHelper } from '../../utils/date.helper';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type SearchCategory = 'all' | 'movie' | 'tv' | 'person';

interface MenuItem {
  label: string;
  icon?: string;
  routerLink?: string;
  queryParams?: Record<string, unknown>;
  routerLinkActiveOptions?: { exact: boolean };
  items?: MenuItem[];
}

@Component({
  selector: 'app-header',
  imports: [
    AutoCompleteModule,
    ImagePipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isDarkMode$: Observable<boolean>;
  menuItems: MenuItem[];
  autoCompleteValue: string;
  isMobile: Signal<boolean>;
  searchResults$: Observable<MultiSearchResult[]>;
  menuOpen = false;
  categoryDropdownOpen = false;
  searchCategory: SearchCategory = 'all';

  private _searchResults: Subject<MultiSearchResult[]> = new Subject();
  private _search: Subject<string> = new Subject();
  private _lastQuery = '';

  readonly categoryLabels: Record<SearchCategory, string> = {
    all: 'All',
    movie: 'Movies',
    tv: 'TV Shows',
    person: 'People',
  };

  readonly categories: SearchCategory[] = ['all', 'movie', 'tv', 'person'];

  constructor(
    private globalStore: GlobalStore,
    private tmdb: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
    private router: Router,
  ) {
    this.menuItems = this.getMenuItems();
    this.isMobile = this.globalStore.isMobile;
    this.searchResults$ = this._searchResults.asObservable();
    this.isDarkMode$ = this.globalStore.isDarkMode$;
    this._search
      .pipe(
        takeUntilDestroyed(),
        debounceTime(500),
        switchMap((query) => {
          this._lastQuery = query;
          return from(this.performSearch(query)).pipe(
            loader(this.ngxUiLoaderService, 'master'),
          );
        }),
        tap((results) => this._searchResults.next(results)),
      )
      .subscribe();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.menuOpen = false;
    this.categoryDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.categoryDropdownOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown')) {
        this.categoryDropdownOpen = false;
      }
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(category: SearchCategory) {
    this.searchCategory = category;
    this.categoryDropdownOpen = false;
    if (this._lastQuery) {
      this._search.next(this._lastQuery);
    }
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

  navigateToItem(item: MultiSearchResult) {
    const mediaType = (item as any).media_type;
    if (mediaType === 'person') {
      this.router.navigate(['/people', item.id]);
    } else {
      this.router.navigate(['/details', mediaType, item.id]);
    }
  }

  private async performSearch(query: string): Promise<MultiSearchResult[]> {
    switch (this.searchCategory) {
      case 'movie': {
        const data = await this.tmdb.search.movies({ query });
        return data.results.map(
          (m) => ({ ...m, media_type: 'movie' }) as MultiSearchResult,
        );
      }
      case 'tv': {
        const data = await this.tmdb.search.tvShows({ query });
        return data.results.map(
          (t) => ({ ...t, media_type: 'tv' }) as MultiSearchResult,
        );
      }
      case 'person': {
        const data = await this.tmdb.search.people({ query });
        return data.results.map(
          (p) => ({ ...p, media_type: 'person' }) as MultiSearchResult,
        );
      }
      default: {
        const data = await this.tmdb.search.multi({ query });
        return data.results;
      }
    }
  }

  private getMenuItems(): MenuItem[] {
    return [
      {
        label: 'Movies',
        icon: 'fa-solid fa-clapperboard',
        items: [
          {
            label: 'Popular',
            routerLink: '/discover/movie',
            queryParams: { sort_by: 'popularity.desc', page: 1 },
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
      },
    ];
  }

  private getSpecificISODate(daysToAdd: number): string {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return DateHelper.formatToISO(currentDate);
  }
}
