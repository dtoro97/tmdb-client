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

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { PersonQuery, StateQuery } from '../../core';
import { AgePipe, FilterPipe, ImagePipe, SortPipe } from '../../shared';
import { CardComponent } from '../card/card.component';
import { CreditsListComponent } from '../credits-list/credits-list.component';
import { SocialLinksComponent } from '../social-links/social-links.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-details.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent implements OnInit {
  person$: Observable<PersonDetails>;
  images$: Observable<Image[]>;
  knownFor$: Observable<any[]>;
  credits$: Observable<PersonCombinedCredits>;
  links$: Observable<ExternalIds>;
  isMobile: Signal<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab$: Observable<string>;
  hasCredits$: Observable<boolean>;
  creditsOptions$: Observable<{ label: string; value: string }[]>;
  visibleCredits$: BehaviorSubject<string>;
  constructor(
    private stateQuery: StateQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private personQuery: PersonQuery,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isMobile = this.stateQuery.isMobile;
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this.images$ = this.personQuery.images$;
    this.links$ = this.personQuery.socialLinks$;
    this.hasCredits$ = this.personQuery.hasCredits$;
    this.tabs$ = this.personQuery.combinedCredits$.pipe(
      map((credits) => this.getTabs(credits))
    );
    this.activeTab$ = this.route.params.pipe(
      map((params) => get(params, 'tab'))
    );
    this.person$ = this.personQuery.person$.pipe(
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.scroller.scrollToPosition([0, 0]);
      })
    );
    this.credits$ = this.personQuery.combinedCredits$;
    this.creditsOptions$ = this.personQuery.combinedCredits$.pipe(
      map((credits) => this.getCreditOptions(credits))
    );
    this.visibleCredits$ = new BehaviorSubject(
      this.getVisibleCredits(this.personQuery.getCredits())
    );
    this.knownFor$ = combineLatest([this.visibleCredits$, this.credits$]).pipe(
      map(([visible, credits]) => {
        if (visible) {
          return get(credits, visible);
        }
      })
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

  private getCreditOptions(
    credits: PersonCombinedCredits
  ): { value: string; label: string }[] {
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
