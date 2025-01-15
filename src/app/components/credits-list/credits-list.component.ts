import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {} from 'lodash';
import { Observable } from 'rxjs';
import { PersonCombinedCredits } from 'tmdb-ts';
import { StateQuery } from '../../state/state.query';

@Component({
  selector: 'app-credits-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credits-list.component.html',
  styleUrl: './credits-list.component.scss',
})
export class CreditsListComponent implements OnInit {
  @Input() set credits(credits: PersonCombinedCredits) {
    this._credits = credits;
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
  }

  get credits(): PersonCombinedCredits {
    return this._credits;
  }

  private _credits: PersonCombinedCredits;
  isDarkMode$: Observable<boolean>;
  isMobile$: Observable<boolean>;
  department: string = 'all';
  media: string = 'all';
  data$: Observable<any[]>;
  departmentOptions = [
    { label: 'All', value: 'all' },
    { label: 'Acting', value: 'acting' },
    { label: 'Production', value: 'production' },
  ];
  mediaOptions = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'movie' },
    { label: 'TV Shows', value: 'tv' },
  ];

  constructor(private stateQuery: StateQuery) {}

  ngOnInit(): void {
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this.isMobile$ = this.stateQuery.isMobile$;
  }
}
