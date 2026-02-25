import { get } from 'lodash';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  switchMap,
  tap,
} from 'rxjs';

import { AsyncPipe, DatePipe, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../../constants';
import { StateQuery } from '../../../core';
import {
  AgePipe,
  CardComponent,
  CreditsListComponent,
  FilterPipe,
  ImagePipe,
  IOption,
  SocialLinksComponent,
  SortPipe,
} from '../../../shared';
import { PersonDetailStoreService } from '../person-store.service';
import { PersonCombinedCredits } from '../../../api';

@Component({
  selector: 'app-person-details',
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
  providers: [PersonDetailStoreService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-details.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent {
  person$ = this.personDetailStore.person$;
  images$ = this.personDetailStore.images$;
  credits$ = this.personDetailStore.credits$;
  links$ = this.personDetailStore.links$;
  isMobile = this.stateQuery.isMobile;
  isDarkMode$ = this.stateQuery.isDarkMode$;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;
  hasCredits$ = this.personDetailStore.hasCredits$;
  creditsOptions$: Observable<IOption[]>;
  visibleCredits$: BehaviorSubject<string>;
  knownFor$;
  constructor(
    private stateQuery: StateQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private personDetailStore: PersonDetailStoreService,
  ) {
    this.tabs$ = this.credits$.pipe(map((credits) => this.getTabs(credits)));
    this.activeTab$ = this.route.params.pipe(
      map((params) => get(params, 'tabId')),
    );
    this.route.paramMap
      .pipe(
        switchMap((paramMap) => {
          return this.personDetailStore.getPersonDetails$(
            Number(paramMap.get('personId')!),
          );
        }),
      )
      .subscribe();
    this.person$ = this.person$.pipe(
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.scroller.scrollToPosition([0, 0]);
      }),
    );
    this.creditsOptions$ = this.credits$.pipe(
      map((credits) => this.getCreditOptions(credits)),
    );
    this.visibleCredits$ = new BehaviorSubject('cast');
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
    if (credits?.cast?.length) {
      return 'cast';
    } else if (credits?.crew?.length) {
      return 'crew';
    }
    return '';
  }

  private getCreditOptions(credits: PersonCombinedCredits): IOption[] {
    const options = [];
    if (credits?.cast?.length) {
      options.push({ label: 'Cast', value: 'cast' });
    }
    if (credits?.crew?.length) {
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
        visible:
          (Boolean(credits!.cast) && credits!.cast!.length > 0) ||
          (Boolean(credits!.crew) && credits!.crew!.length > 0),
      },
      { title: 'Photos', value: 'photos', visible: true },
    ];
  }
}
