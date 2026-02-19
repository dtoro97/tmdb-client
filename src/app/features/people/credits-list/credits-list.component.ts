import { get } from 'lodash';
import { PersonCombinedCredits } from 'tmdb-ts';

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImagePipe } from '../../../shared/pipes/image.pipe';
import { Option } from '../../../shared/interfaces/option.interface';
import { GlobalStore } from '../../../core/global.store';
import { PillToggleComponent } from '../../../shared';

export interface CreditItem {
  id: number;
  title?: string;
  name?: string;
  media_type: string;
  character?: string;
  job?: string;
  poster_path?: string;
  backdrop_path?: string;
  year: string;
  date: string | Date | null;
}

export interface YearGroup {
  year: string;
  items: CreditItem[];
}

@Component({
  selector: 'app-credits-list',
  imports: [RouterLink, ImagePipe, PillToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credits-list.component.html',
  styleUrl: './credits-list.component.scss',
})
export class CreditsListComponent {
  @Input() set credits(credits: PersonCombinedCredits) {
    this._credits = credits;

    const deptOpts: Option[] = [];
    if (credits.cast.length) {
      deptOpts.push({ label: 'Acting', value: 'acting' });
    }
    if (credits.crew.length) {
      deptOpts.push({ label: 'Production', value: 'production' });
    }
    this.departmentOptions = deptOpts;
    this.department = deptOpts[0]?.value || 'acting';

    const allItems = [...credits.cast, ...credits.crew];
    const hasMovies = allItems.some((c) => get(c, 'media_type') === 'movie');
    const hasTv = allItems.some((c) => get(c, 'media_type') === 'tv');
    const mediaOpts: Option[] = [{ label: 'All', value: 'all' }];
    if (hasMovies) mediaOpts.push({ label: 'Movies', value: 'movie' });
    if (hasTv) mediaOpts.push({ label: 'TV', value: 'tv' });
    this.mediaOptions = mediaOpts;

    this.rebuildGroups();
  }

  get credits(): PersonCombinedCredits {
    return this._credits;
  }

  private _credits: PersonCombinedCredits;
  isMobile: Signal<boolean>;
  department = 'acting';
  media = 'all';
  departmentOptions: Option[] = [];
  mediaOptions: Option[] = [];
  yearGroups: YearGroup[] = [];
  visibleCount = 10;
  readonly PAGE_SIZE = 10;

  constructor(private globalStore: GlobalStore) {
    this.isMobile = this.globalStore.isMobile;
  }

  get visibleYearGroups(): YearGroup[] {
    let count = 0;
    const result: YearGroup[] = [];
    for (const group of this.yearGroups) {
      if (count >= this.visibleCount) break;
      const remaining = this.visibleCount - count;
      if (group.items.length <= remaining) {
        result.push(group);
        count += group.items.length;
      } else {
        result.push({
          year: group.year,
          items: group.items.slice(0, remaining),
        });
        count += remaining;
      }
    }
    return result;
  }

  get totalItems(): number {
    return this.yearGroups.reduce((sum, g) => sum + g.items.length, 0);
  }

  get hasMore(): boolean {
    return this.visibleCount < this.totalItems;
  }

  loadMore(): void {
    this.visibleCount += this.PAGE_SIZE;
  }

  setDepartment(value: string): void {
    this.department = value;
    this.visibleCount = this.PAGE_SIZE;
    this.rebuildGroups();
  }

  setMedia(value: string): void {
    this.media = value;
    this.visibleCount = this.PAGE_SIZE;
    this.rebuildGroups();
  }

  private rebuildGroups(): void {
    if (!this._credits) return;

    let items: any[] = [];
    if (this.department === 'acting') {
      items = this._credits.cast;
    } else if (this.department === 'production') {
      items = this._credits.crew;
    }
    let mapped: CreditItem[] = items.map((r) => {
      const dateStr = r.first_air_date || r.release_date || null;
      return {
        ...r,
        date: dateStr,
        year: dateStr ? new Date(dateStr).getFullYear().toString() : '—',
      };
    });

    if (this.media !== 'all') {
      mapped = mapped.filter((item) => item.media_type === this.media);
    }

    mapped.sort((a, b) => {
      if (a.year === '—') return 1;
      if (b.year === '—') return -1;
      return Number(b.year) - Number(a.year);
    });

    // Group by year
    const groupMap = new Map<string, CreditItem[]>();
    for (const item of mapped) {
      const existing = groupMap.get(item.year);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(item.year, [item]);
      }
    }

    this.yearGroups = Array.from(groupMap.entries()).map(([year, items]) => ({
      year,
      items,
    }));
  }
}
