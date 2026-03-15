import { get } from 'lodash';
import { SelectModule } from 'primeng/select';

import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigStoreService, FilterPipe, IOption, SortPipe } from '../..';
import { PersonCombinedCredits } from '../../../api';

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
export class CreditsListComponent {
  @Input() set credits(credits: PersonCombinedCredits) {
    this._credits = {
      ...credits,
      cast: credits?.cast?.map((r) => ({
        ...r,
        date:
          r.first_air_date ||
          (r.release_date && new Date(r.first_air_date || r.release_date)),
      })),
      crew: credits?.crew?.map((r) => ({
        ...r,
        date:
          r.first_air_date ||
          (r.release_date && new Date(r.first_air_date || r.release_date)),
      })),
    };
    const departmentOptions = [{ label: 'All', value: 'all' }];
    if (this._credits?.cast?.length) {
      departmentOptions.push({ label: 'Acting', value: 'acting' });
    }
    if (this._credits?.crew?.length) {
      departmentOptions.push({ label: 'Production', value: 'production' });
    }
    this.departmentOptions = departmentOptions;

    const mediaOptions = [{ label: 'All', value: 'all' }];
    if (
      this._credits?.cast?.some((c) => get(c, 'media_type') === 'movie') ||
      this._credits?.crew?.some((c) => get(c, 'media_type') === 'movie')
    ) {
      mediaOptions.push({ label: 'Movies', value: 'movie' });
    }
    if (
      this._credits?.cast?.some((c) => get(c, 'media_type') === 'tv') ||
      this._credits?.crew?.some((c) => get(c, 'media_type') === 'tv')
    ) {
      mediaOptions.push({ label: 'TV Shows', value: 'tv' });
    }
    this.mediaOptions = mediaOptions;
  }

  get credits(): PersonCombinedCredits {
    return this._credits;
  }

  private _credits: PersonCombinedCredits;
  isDarkMode$ = this.configStoreService.isDarkMode$;
  department: string = 'all';
  media: string = 'all';
  departmentOptions: IOption[];
  mediaOptions: IOption[];

  constructor(private configStoreService: ConfigStoreService) {}
}
