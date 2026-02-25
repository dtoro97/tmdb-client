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
import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { CardComponent, ConfigStoreService, IOption } from '../../../shared';
import { movieSortOptions, tvSortOptions } from '../sort-options';
import { MediaListStoreService } from '../media-list-store.service';
import { ItemWithNameAndId } from '../../../api';

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
  providers: [MediaListStoreService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
})
export class MediaListPageComponent {
  filterOptions$ = this.mediaListStoreService.filterOptions$;
  type$: Observable<string>;
  sortOptions$: Observable<IOption[]>;
  genres$ = this.mediaListStoreService.genres$;
  data$ = this.mediaListStoreService.data$;
  total$ = this.mediaListStoreService.total$;
  skip$ = this.mediaListStoreService.skip$;
  filterPanelState: boolean;
  title: string;
  constructor(
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title,
    public mediaListStoreService: MediaListStoreService,
    private configStoreService: ConfigStoreService,
  ) {
    this.type$ = this.route.queryParams.pipe(
      map((params) => params['type']),
      tap((type) => this.setTitle(type)),
    );
    this.sortOptions$ = this.type$.pipe(
      map((type) => (type === 'tv' ? tvSortOptions : movieSortOptions)),
    );
    this.mediaListStoreService.startGettingData();
  }

  onPageChange(change: PaginatorState): void {
    this.mediaListStoreService.updatePage(change.page! + 1);
    this.scroller.scrollToPosition([0, 0]);
  }

  toggleGenreSelection(genre: ItemWithNameAndId) {
    this.mediaListStoreService.updateGenreSelection(genre.id!);
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
