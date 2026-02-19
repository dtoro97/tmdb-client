import { get } from 'lodash';
import { GalleriaModule } from 'primeng/galleria';
import { BehaviorSubject, combineLatest, map, Observable, tap } from 'rxjs';
import {
  ExternalIds,
  Image,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { AsyncPipe, DatePipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';

import { GlobalStore } from '../../../core/global.store';
import { PersonDetailStore } from '../person-store.service';
import { AgePipe } from '../../../shared/pipes/age.pipe';
import { ImagePipe } from '../../../shared/pipes/image.pipe';
import { Option } from '../../../shared/interfaces/option.interface';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { SocialLinksComponent } from '../../../shared/ui/social-links/social-links.component';
import { CreditsListComponent } from '../credits-list/credits-list.component';
import { PillToggleComponent } from '../../../shared';

interface KnownForYearGroup {
  year: string;
  items: any[];
}

@Component({
  selector: 'app-person-detail-page',
  imports: [
    ImagePipe,
    GalleriaModule,
    AsyncPipe,
    CardComponent,
    CreditsListComponent,
    AgePipe,
    SocialLinksComponent,
    DatePipe,
    PillToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-detail-page.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailPageComponent {
  person$: Observable<PersonDetails>;
  knownForGroups$: Observable<KnownForYearGroup[]>;
  credits$: Observable<PersonCombinedCredits>;
  links$: Observable<ExternalIds>;
  isMobile: Signal<boolean>;
  hasCredits$: Observable<boolean>;
  creditsOptions$: Observable<Option[]>;
  visibleCredits$: BehaviorSubject<string>;
  bioExpanded = false;

  // Galleria state
  galleriaVisible = false;
  galleriaImages: { source: string; thumbnail: string }[] = [];
  galleriaActiveIndex = 0;
  allPhotos: Image[] = [];

  constructor(
    private scroller: ViewportScroller,
    private titleService: Title,
    private cdr: ChangeDetectorRef,
    public personDetailStore: PersonDetailStore,
    public globalStore: GlobalStore,
  ) {
    this.isMobile = this.globalStore.isMobile;
    this.links$ = this.personDetailStore.socialLinks$;
    this.hasCredits$ = this.personDetailStore.hasCredits$;

    this.person$ = this.personDetailStore.person$.pipe(
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.scroller.scrollToPosition([0, 0]);
      }),
    );

    this.personDetailStore.images$
      .pipe(tap((images) => (this.allPhotos = images)))
      .subscribe();

    this.credits$ = this.personDetailStore.combinedCredits$;
    this.creditsOptions$ = this.personDetailStore.combinedCredits$.pipe(
      map((credits) => this.getCreditOptions(credits)),
    );
    this.visibleCredits$ = new BehaviorSubject(
      this.getVisibleCredits(this.personDetailStore.getCredits()),
    );
    this.knownForGroups$ = combineLatest([
      this.visibleCredits$,
      this.credits$,
    ]).pipe(
      map(([visible, credits]) => {
        const items: any[] = visible ? get(credits, visible) || [] : [];
        return this.groupByYear(items);
      }),
    );
  }

  changeVisibleCredits(value: string) {
    this.visibleCredits$.next(value);
  }

  toggleBio(): void {
    this.bioExpanded = !this.bioExpanded;
    this.cdr.markForCheck();
  }

  openGalleria(images: Image[], startIndex = 0): void {
    this.galleriaImages = images.map((img) => ({
      source: `https://image.tmdb.org/t/p/original${img.file_path}`,
      thumbnail: `https://image.tmdb.org/t/p/w300${img.file_path}`,
    }));
    this.galleriaActiveIndex = startIndex;
    this.galleriaVisible = true;
    this.cdr.markForCheck();
  }

  onGalleriaClose(): void {
    this.galleriaVisible = false;
    this.cdr.markForCheck();
  }

  private groupByYear(items: any[]): KnownForYearGroup[] {
    // Sort by date descending, then by vote_average within each year
    const sorted = [...items].sort((a, b) => {
      const dateA = a.first_air_date || a.release_date || '';
      const dateB = b.first_air_date || b.release_date || '';
      if (!dateA && !dateB)
        return (b.vote_average || 0) - (a.vote_average || 0);
      if (!dateA) return 1;
      if (!dateB) return -1;
      const yearDiff =
        new Date(dateB).getFullYear() - new Date(dateA).getFullYear();
      return yearDiff !== 0
        ? yearDiff
        : (b.vote_average || 0) - (a.vote_average || 0);
    });

    const groupMap = new Map<string, any[]>();
    for (const item of sorted) {
      const dateStr = item.first_air_date || item.release_date || null;
      const year = dateStr ? new Date(dateStr).getFullYear().toString() : '—';
      const existing = groupMap.get(year);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(year, [item]);
      }
    }

    return Array.from(groupMap.entries()).map(([year, items]) => ({
      year,
      items,
    }));
  }

  private getVisibleCredits(credits: PersonCombinedCredits): string {
    if (credits.cast.length) {
      return 'cast';
    } else if (credits.crew.length) {
      return 'crew';
    }
    return '';
  }

  private getCreditOptions(credits: PersonCombinedCredits): Option[] {
    const options = [];
    if (credits.cast.length) {
      options.push({ label: 'Cast', value: 'cast' });
    }
    if (credits.crew.length) {
      options.push({ label: 'Production', value: 'crew' });
    }
    return options;
  }
}
