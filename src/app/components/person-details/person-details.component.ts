import { combineLatest, map, Observable, Subject, tap } from 'rxjs';
import {
  ExternalIds,
  PeopleImages,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { StateQuery } from '../../state/state.query';
import { StateService } from '../../state/state.service';
import { get, uniqBy } from 'lodash';

@Component({
  selector: 'app-person-details',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-details.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent implements OnInit {
  person$: Observable<PersonDetails>;
  images$: Observable<PeopleImages>;
  knownFor$: Observable<any[]>;
  credits$: Observable<PersonCombinedCredits>;
  personAge$: Observable<number>;
  links$: Observable<ExternalIds>;
  isMobile$: Observable<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  links: ExternalIds;
  tabs$: Observable<{ title: string; value: string; visible: boolean }[]>;
  activeTab: string = 'knownFor';
  hasCredits$: Observable<boolean>;
  creditsOptions: any[];
  visibleCredits$: Observable<string | undefined>;
  private _visbileCredits: Subject<any> = new Subject();
  constructor(
    private sessionQuery: StateQuery,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.visibleCredits$ = this._visbileCredits.asObservable();
    this.person$ = this.route.data.pipe(
      map((data) => get(data, 'item')),
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.stateService.setLoading(false);
        this.scroller.scrollToPosition([0, 0]);
      })
    );
    this.images$ = this.route.data.pipe(
      map((data) => get(data, 'images.profiles', []))
    );
    this.links$ = this.route.data.pipe(map((data) => get(data, 'socialLinks')));
    this.credits$ = this.route.data.pipe(
      map((data) => {
        const credits = get(data, 'credits');
        this.setVisibleCredits(credits);
        this.setCreditsOptions(credits);
        return {
          ...credits,
          cast: uniqBy(credits.cast, 'id'),
          crew: uniqBy(credits.crew, 'id'),
        };
      })
    );
    this.personAge$ = this.person$.pipe(
      map((person) => this.getPersonAge(person))
    );
    this.tabs$ = this.credits$.pipe(map((credits) => this.getTabs(credits)));
    this.hasCredits$ = this.credits$.pipe(
      map((credits) => credits.cast.length > 0 || credits.crew.length > 0)
    );
    this.knownFor$ = combineLatest([this.visibleCredits$, this.credits$]).pipe(
      map(([visible, credits]) => {
        if (visible) {
          return get(credits, visible);
        }
      })
    );
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
  }

  changeVisibleCredits(value: string) {
    this._visbileCredits.next(value);
  }

  private setVisibleCredits(credits: PersonCombinedCredits): void {
    if (credits.cast.length) {
      this._visbileCredits.next('cast');
    } else if (credits.crew.length) {
      this._visbileCredits.next('crew');
    }
  }

  private setCreditsOptions(credits: PersonCombinedCredits): void {
    const options = [];
    if (credits.cast.length) {
      options.push({ label: 'Cast', value: 'cast' });
    }
    if (credits.crew.length) {
      options.push({ label: 'Production', value: 'crew' });
    }
    this.creditsOptions = options;
  }

  private getPersonAge(person: PersonDetails): number {
    const difference =
      ((person.deathday ? new Date(person.deathday) : new Date()).getTime() -
        new Date(person.birthday).getTime()) /
      1000 /
      (60 * 60 * 24);
    return Math.abs(Math.round(difference / 365.25));
  }

  private getTabs(credits: PersonCombinedCredits) {
    return [
      { title: 'Known For', value: 'knownFor', visible: true },
      {
        title: 'Credits',
        value: 'credits',
        visible: credits.cast.length > 0 || credits.crew.length > 0,
      },
      { title: 'Photos', value: 'photos', visible: true },
    ];
  }
}
