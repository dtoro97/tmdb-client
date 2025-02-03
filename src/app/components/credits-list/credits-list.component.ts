import { get } from 'lodash';
import { SelectModule } from 'primeng/select';
import { Observable } from 'rxjs';
import { PersonCombinedCredits } from 'tmdb-ts';

import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FilterPipe, SortPipe } from '../../shared';
import { StateQuery } from '../../core';

@Component({
  selector: 'app-credits-list',
  imports: [
    SelectModule,
    FormsModule,
    AsyncPipe,
    SortPipe,
    FilterPipe,
    DatePipe,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credits-list.component.html',
  styleUrl: './credits-list.component.scss',
})
export class CreditsListComponent implements OnInit {
  @Input() set credits(credits: PersonCombinedCredits) {
    this._credits = {
      ...credits,
      cast: credits.cast.map((r) => ({
        ...r,
        date:
          r.first_air_date ||
          (r.release_date && new Date(r.first_air_date || r.release_date)),
      })),
      crew: credits.crew.map((r) => ({
        ...r,
        date:
          r.first_air_date ||
          (r.release_date && new Date(r.first_air_date || r.release_date)),
      })),
    };
    const departmentOptions = [{ label: 'All', value: 'all' }];
    if (this._credits.cast.length) {
      departmentOptions.push({ label: 'Acting', value: 'acting' });
    }
    if (this._credits.crew.length) {
      departmentOptions.push({ label: 'Production', value: 'production' });
    }
    this.departmentOptions = departmentOptions;

    const mediaOptions = [{ label: 'All', value: 'all' }];
    if (
      this._credits.cast.some((c) => get(c, 'media_type') === 'movie') ||
      this._credits.crew.some((c) => get(c, 'media_type') === 'movie')
    ) {
      mediaOptions.push({ label: 'Movies', value: 'movie' });
    }
    if (
      this._credits.cast.some((c) => get(c, 'media_type') === 'tv') ||
      this._credits.crew.some((c) => get(c, 'media_type') === 'tv')
    ) {
      mediaOptions.push({ label: 'TV Shows', value: 'tv' });
    }
    this.mediaOptions = mediaOptions;
  }

  get credits(): PersonCombinedCredits {
    return this._credits;
  }

  private _credits: PersonCombinedCredits;
  isDarkMode$: Observable<boolean>;
  isMobile: Signal<boolean>;
  department: string = 'all';
  media: string = 'all';
  data$: Observable<any[]>;
  departmentOptions: any[];
  mediaOptions: any[];

  constructor(private stateQuery: StateQuery) {}

  ngOnInit(): void {
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this.isMobile = this.stateQuery.isMobile;
  }
}
