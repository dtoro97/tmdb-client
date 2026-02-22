import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { Chip, ChipModule } from 'primeng/chip';
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

import { ListQuery, ListService, StateQuery } from '../../core';
import { CardComponent, IGenre, IOption } from '../../shared';
import { movieSortOptions, tvSortOptions } from './sort-options';

@Component({
  selector: 'app-media-list',
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
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
})
export class MediaListComponent implements OnInit {
  isMobile: Signal<boolean>;
  type$: Observable<string>;
  sortOptions$: Observable<IOption[]>;
  genres$: Observable<IGenre[]>;
  filterPanelState: boolean;
  title: string;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private stateQuery: StateQuery,
    private titleService: Title,
    public listQuery: ListQuery,
    public listService: ListService,
  ) {}
  ngOnInit(): void {
    this.isMobile = this.stateQuery.isMobile;
    this.type$ = this.route.params.pipe(
      map((params) => params['type']),
      tap((type) => this.setTitle(type)),
    );
    this.genres$ = combineLatest([
      this.type$.pipe(
        switchMap((type) =>
          type === 'tv'
            ? this.stateQuery.tvGenres$
            : this.stateQuery.movieGenres$,
        ),
      ),
      this.listQuery.genres$,
    ]).pipe(
      map(([allGenres, selected]) => {
        return allGenres.map((genre) => ({
          ...genre,
          selected: selected.includes(genre.id.toString()),
        }));
      }),
    );
    this.sortOptions$ = this.type$.pipe(
      map((type) => (type === 'tv' ? tvSortOptions : movieSortOptions)),
    );
    this.filterPanelState = !this.isMobile();
  }

  search(): void {
    const type = this.route.snapshot.params['type'];
    const queryParams = this.listService.toQueryParams(type);
    this.router.navigate(['list', type], { queryParams });
    if (this.stateQuery.isMobile()) {
      this.filterPanelState = false;
    }
  }

  onPageChange(change: PaginatorState): void {
    this.listService.updatePage(change.page! + 1);
    this.search();
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: IGenre) {
    this.listService.updateGenreSelection(genre.id);
  }

  private setTitle(type: string): void {
    switch (true) {
      case type === 'person':
        this.title = 'Popular People';
        break;
      case type === 'tv':
        this.title = 'Browse TV Shows';
        break;
      case type === 'movie':
        this.title = 'Browse Movies';
        break;
      default:
        this.title = '';
    }
    this.titleService.setTitle(this.title);
  }
}
