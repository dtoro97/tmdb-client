import { CarouselModule } from 'primeng/carousel';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  BehaviorSubject,
  first,
  from,
  map,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { Movie, PopularTvShowResult, TimeWindow } from 'tmdb-ts';

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { TmdbService } from '../../services/tmdb.service';
import { StateService } from '../../state/state.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-home',
  imports: [
    SelectButtonModule,
    CarouselModule,
    AsyncPipe,
    FormsModule,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  trending$: Observable<any[]>;
  popular$: Observable<Movie[] | PopularTvShowResult[]>;
  upcomingMovies$: Observable<Movie[]>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  trendingOptions = [
    { label: 'Today', value: 'day' },
    { label: 'This Week', value: 'week' },
  ];
  popularOptions = [
    {
      label: 'TV Shows',
      value: 'tv',
    },
    {
      label: 'Movies',
      value: 'movie',
    },
  ];
  selectedTrending$: Observable<string>;
  selectedPopular$: Observable<string>;
  private _selectedTrending: BehaviorSubject<string> = new BehaviorSubject(
    'day'
  );
  private _selectedPopular: BehaviorSubject<string> = new BehaviorSubject('tv');
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  ngOnInit(): void {
    this.selectedTrending$ = this._selectedTrending.asObservable();
    this.selectedPopular$ = this._selectedPopular.asObservable();
    this.trending$ = this.selectedTrending$.pipe(
      switchMap((timeWindow) => {
        return from(
          this.tmdb.trending.trending('all', timeWindow as TimeWindow)
        );
      }),
      map((data) => data.results),
      tap(() => this.stateService.setLoading(false))
    );
    this.upcomingMovies$ = from(this.tmdb.movies.upcoming()).pipe(
      first(),
      map((data) => data.results || [])
    );

    this.popular$ = this.selectedPopular$.pipe(
      switchMap((mediaType) => {
        if (mediaType === 'tv') {
          return from(this.tmdb.tvShows.popular());
        }
        return this.tmdb.movies.popular();
      }),
      map((data) => data.results),
      tap(() => this.stateService.setLoading(false))
    );
  }

  changeTrending(timeWindow: string) {
    if (timeWindow && this._selectedTrending.value !== timeWindow) {
      this.stateService.setLoading(true);
      this._selectedTrending.next(timeWindow);
    }
  }
  changePopular(mediaType: string) {
    if (mediaType && this._selectedPopular.value !== mediaType) {
      this.stateService.setLoading(true);
      this._selectedPopular.next(mediaType);
    }
  }
}
