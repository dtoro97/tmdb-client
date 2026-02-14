import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { combineLatest, map, Observable, switchMap, tap } from 'rxjs';

import { AsyncPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { AppStoreService } from '../../../core/app-store.service';
import { DiscoverStoreService } from '../discover-store.service';
import { DiscoverFilterService } from '../discover-filter.service';
import { SelectableGenre } from '../../../shared/interfaces/genre.interface';
import { Option } from '../../../shared/interfaces/option.interface';
import { MediaTypeEnum } from '../../../shared/constants/media-type.constants';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-discover-page',
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
  templateUrl: './discover-page.component.html',
  styleUrl: './discover-page.component.scss',
})
export class DiscoverPageComponent implements OnInit {
  isMobile: Signal<boolean>;
  type$: Observable<string>;
  sortOptions$: Observable<Option[]>;
  genres$: Observable<SelectableGenre[]>;
  filterPanelState: boolean;
  title: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private appStore: AppStoreService,
    private titleService: Title,
    private discoverFilterService: DiscoverFilterService,
    public discoverStore: DiscoverStoreService,
  ) {}

  ngOnInit(): void {
    this.isMobile = this.appStore.isMobile;
    this.type$ = this.route.params.pipe(
      map((params) => params['type']),
      tap((type) => this.setTitle(type)),
    );
    this.genres$ = combineLatest([
      this.type$.pipe(
        switchMap((type) =>
          type === MediaTypeEnum.TV
            ? this.appStore.tvGenres$
            : this.appStore.movieGenres$,
        ),
      ),
      this.discoverStore.genres$,
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
    this.filterPanelState = !this.isMobile();
  }

  search(): void {
    const type = this.route.snapshot.params['type'];
    const queryParams = this.discoverStore.toQueryParams(type);
    this.router.navigate(['discover', type], { queryParams });
    if (this.appStore.isMobile()) {
      this.filterPanelState = false;
    }
  }

  onPageChange(change: PaginatorState): void {
    this.discoverStore.updatePage(change.page! + 1);
    this.search();
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: SelectableGenre) {
    this.discoverStore.updateGenreSelection(genre.id);
  }

  private setTitle(type: string): void {
    switch (type) {
      case MediaTypeEnum.TV:
        this.title = 'Browse TV Shows';
        break;
      case MediaTypeEnum.MOVIE:
        this.title = 'Browse Movies';
        break;
      default:
        this.title = '';
    }
    this.titleService.setTitle(this.title);
  }
}
