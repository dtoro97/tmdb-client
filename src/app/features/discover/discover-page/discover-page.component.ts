import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import {
  combineLatest,
  map,
  Observable,
  Subject,
  switchMap,
  tap,
  debounceTime,
  takeUntil,
} from 'rxjs';

import { AsyncPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { GlobalStore } from '../../../core/global.store';
import { DiscoverStoreService } from '../discover-store.service';
import { DiscoverFilterService } from '../discover-filter.service';
import { SelectableGenre } from '../../../shared/interfaces/genre.interface';
import { Option } from '../../../shared/interfaces/option.interface';
import { MediaTypeEnum } from '../../../shared/constants/media-type.constants';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { PillToggleComponent } from '../../../shared/ui/pill-toggle/pill-toggle.component';

@Component({
  selector: 'app-discover-page',
  imports: [
    ButtonModule,
    SelectModule,
    DatePickerModule,
    ChipModule,
    SliderModule,
    PaginatorModule,
    AsyncPipe,
    CardComponent,
    FormsModule,
    PillToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover-page.component.html',
  styleUrl: './discover-page.component.scss',
})
export class DiscoverPageComponent implements OnDestroy {
  isMobile: Signal<boolean>;
  type$: Observable<string>;
  currentType: string = 'movie';
  sortOptions$: Observable<Option[]>;
  genres$: Observable<SelectableGenre[]>;
  showAdvancedFilters = false;

  typeOptions = [
    { label: 'Movies', value: 'movie' },
    { label: 'TV Shows', value: 'tv' },
  ];

  private destroy$ = new Subject<void>();
  private searchTrigger$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private globalStore: GlobalStore,
    private titleService: Title,
    private discoverFilterService: DiscoverFilterService,
    public discoverStoreService: DiscoverStoreService,
  ) {
    this.isMobile = this.globalStore.isMobile;
    this.type$ = this.route.params.pipe(
      map((params) => params['type']),
      tap((type) => {
        this.currentType = type;
        this.setTitle(type);
      }),
    );
    this.genres$ = combineLatest([
      this.type$.pipe(
        switchMap((type) =>
          type === MediaTypeEnum.TV
            ? this.discoverStoreService.tvGenres$
            : this.discoverStoreService.movieGenres$,
        ),
      ),
      this.discoverStoreService.genres$,
    ]).pipe(
      map(([allGenres, selected]) => {
        return allGenres.map((genre) => ({
          ...genre,
          selected: selected.includes(genre.id.toString()),
        }));
      }),
    );
    this.sortOptions$ = this.type$.pipe(
      map((type) => this.discoverFilterService.getSortOptions(type)),
    );

    this.searchTrigger$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.search());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  search(): void {
    const type = this.route.snapshot.params['type'];
    const queryParams = this.discoverStoreService.toQueryParams(type);
    this.router.navigate(['discover', type], { queryParams });
  }

  triggerSearch(): void {
    this.searchTrigger$.next();
  }

  switchType(type: unknown): void {
    const newType = type as string;
    this.discoverStoreService.updateGenres([]);
    const queryParams = this.discoverStoreService.toQueryParams(newType);
    this.router.navigate(['discover', newType], { queryParams });
  }

  onPageChange(change: PaginatorState): void {
    this.discoverStoreService.updatePage(change.page! + 1);
    this.search();
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: SelectableGenre): void {
    this.discoverStoreService.updateGenreSelection(genre.id);
    this.triggerSearch();
  }

  onSortChange(value: string): void {
    this.discoverStoreService.updateSortBy(value);
    this.triggerSearch();
  }

  onFromDateChange(date: Date | undefined): void {
    this.discoverStoreService.updateFromDate(date);
    this.triggerSearch();
  }

  onToDateChange(date: Date | undefined): void {
    this.discoverStoreService.updateToDate(date);
    this.triggerSearch();
  }

  onVoteAverageChange(value: number[]): void {
    this.discoverStoreService.updateVoteAverage(value);
    this.triggerSearch();
  }

  onMinVoteCountChange(value: number): void {
    this.discoverStoreService.updateMinVoteCount(value);
    this.triggerSearch();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearGenres(): void {
    this.discoverStoreService.updateGenres([]);
    this.triggerSearch();
  }

  clearDates(): void {
    this.discoverStoreService.updateFromDate(undefined);
    this.discoverStoreService.updateToDate(undefined);
    this.triggerSearch();
  }

  clearScoreFilters(): void {
    this.discoverStoreService.updateVoteAverage([0, 10]);
    this.discoverStoreService.updateMinVoteCount(0);
    this.triggerSearch();
  }

  private setTitle(type: string): void {
    switch (type) {
      case MediaTypeEnum.TV:
        this.titleService.setTitle('Discover TV Shows');
        break;
      case MediaTypeEnum.MOVIE:
        this.titleService.setTitle('Discover Movies');
        break;
    }
  }
}
