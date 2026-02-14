import { get } from 'lodash';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
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
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../../constants';
import { AppStoreService } from '../../../core/app-store.service';
import { PersonDetailStore } from '../person-store.service';
import { AgePipe } from '../../../shared/pipes/age.pipe';
import { FilterPipe } from '../../../shared/pipes/filter.pipe';
import { ImagePipe } from '../../../shared/pipes/image.pipe';
import { SortPipe } from '../../../shared/pipes/sort.pipe';
import { Option } from '../../../shared/interfaces/option.interface';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { SocialLinksComponent } from '../../../shared/ui/social-links/social-links.component';
import { CreditsListComponent } from '../credits-list/credits-list.component';

@Component({
  selector: 'app-person-detail-page',
  imports: [
    ImagePipe,
    TabsModule,
    SelectModule,
    AsyncPipe,
    CardComponent,
    SortPipe,
    CreditsListComponent,
    FilterPipe,
    AgePipe,
    SocialLinksComponent,
    FormsModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-detail-page.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailPageComponent implements OnInit {
  person$: Observable<PersonDetails>;
  images$: Observable<Image[]>;
  knownFor$: Observable<any[] | undefined>;
  credits$: Observable<PersonCombinedCredits>;
  links$: Observable<ExternalIds>;
  isMobile: Signal<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;
  hasCredits$: Observable<boolean>;
  creditsOptions$: Observable<Option[]>;
  visibleCredits$: BehaviorSubject<string>;

  constructor(
    private appStore: AppStoreService,
    private scroller: ViewportScroller,
    private titleService: Title,
    private personDetailStore: PersonDetailStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.isMobile = this.appStore.isMobile;
    this.isDarkMode$ = this.appStore.isDarkMode$;
    this.images$ = this.personDetailStore.images$;
    this.links$ = this.personDetailStore.socialLinks$;
    this.hasCredits$ = this.personDetailStore.hasCredits$;
    this.tabs$ = this.personDetailStore.combinedCredits$.pipe(
      map((credits) => this.getTabs(credits)),
    );
    this.activeTab$ = this.route.params.pipe(
      map((params) => get(params, 'tab')),
    );
    this.person$ = this.personDetailStore.person$.pipe(
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.scroller.scrollToPosition([0, 0]);
      }),
    );
    this.credits$ = this.personDetailStore.combinedCredits$;
    this.creditsOptions$ = this.personDetailStore.combinedCredits$.pipe(
      map((credits) => this.getCreditOptions(credits)),
    );
    this.visibleCredits$ = new BehaviorSubject(
      this.getVisibleCredits(this.personDetailStore.getCredits()),
    );
    this.knownFor$ = combineLatest([this.visibleCredits$, this.credits$]).pipe(
      map(([visible, credits]) => {
        if (visible) {
          return get(credits, visible);
        }
      }),
    );
  }

  changeTab(tab: string): void {
    this.router.navigate([`../${tab}`], { relativeTo: this.route });
  }

  changeVisibleCredits(value: string) {
    this.visibleCredits$.next(value);
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

  private getTabs(credits: PersonCombinedCredits) {
    return [
      { title: 'Known For', value: 'overview', visible: true },
      {
        title: 'Credits',
        value: 'credits',
        visible: credits.cast.length > 0 || credits.crew.length > 0,
      },
      { title: 'Photos', value: 'photos', visible: true },
    ];
  }
}
