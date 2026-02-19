import { uniqBy } from 'lodash';
import { GalleriaModule } from 'primeng/galleria';
import { map, Observable, tap } from 'rxjs';
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
import { CardComponent } from '../../../shared/ui/card/card.component';
import { SocialLinksComponent } from '../../../shared/ui/social-links/social-links.component';
import { CreditsListComponent } from '../credits-list/credits-list.component';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-detail-page.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailPageComponent {
  person$: Observable<PersonDetails>;
  knownFor$: Observable<any[]>;
  credits$: Observable<PersonCombinedCredits>;
  links$: Observable<ExternalIds>;
  isMobile: Signal<boolean>;
  hasCredits$: Observable<boolean>;
  bioExpanded = false;
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

    this.knownFor$ = this.credits$.pipe(
      map((credits) => {
        const all = uniqBy([...credits.cast, ...credits.crew], 'id');
        return all
          .filter((item: any) => item.poster_path)
          .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 5);
      }),
    );
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
}
