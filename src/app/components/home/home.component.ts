import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TmdbService } from '../../services/tmdb.service';
import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { LoaderService } from '../../services';
import { SessionQuery } from '../../state/session.query';

@Component({
  selector: 'app-home',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  trending$: Observable<any>;
  popular$: Observable<any>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  trendingOptions = [
    { label: 'Today', value: 'day' },
    { label: 'This Week', value: 'week' },
  ];
  popularOptions = [
    {
      label: 'Streaming',
      value: 'tv',
    },
    {
      label: 'In Theatres',
      value: 'movie',
    },
  ];
  selectedTrending$: Observable<string>;
  selectedPopular$: Observable<string>;
  private _selectedTrending: BehaviorSubject<string> = new BehaviorSubject(
    'day'
  );
  private _selectedPopular: BehaviorSubject<string> = new BehaviorSubject('tv');
  constructor(
    private tmdbService: TmdbService,
    private loader: LoaderService,
    private sessionQuery: SessionQuery
  ) {}
  ngOnInit(): void {
    console.log(this.sessionQuery.providerIds);
    this.selectedTrending$ = this._selectedTrending.asObservable();
    this.selectedPopular$ = this._selectedPopular.asObservable();
    this.trending$ = this.selectedTrending$.pipe(
      switchMap((timeWindow) => {
        return this.tmdbService.getTrending('all', timeWindow);
      }),
      map((data) => data?.results || []),
      tap(() => this.loader.setLoading(false))
    );

    this.popular$ = this.selectedPopular$.pipe(
      switchMap((mediaType) => {
        return this.tmdbService.getPopular(mediaType);
      }),
      map((data) => data?.results || []),
      tap(() => this.loader.setLoading(false))
    );
  }

  changeTrending(timeWindow: string) {
    if (timeWindow && this._selectedTrending.value !== timeWindow) {
      this.loader.setLoading(true);
      this._selectedTrending.next(timeWindow);
    }
  }
  changePopular(mediaType: string) {
    if (mediaType && this._selectedPopular.value !== mediaType) {
      this.loader.setLoading(true);
      this._selectedPopular.next(mediaType);
    }
  }
}
