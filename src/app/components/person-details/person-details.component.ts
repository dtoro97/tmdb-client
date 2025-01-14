import { Observable, Subscription } from 'rxjs';
import {
  ExternalIds,
  PeopleImages,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { StateQuery } from '../../state/state.query';
import { StateService } from '../../state/state.service';

@Component({
  selector: 'app-person-details',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-details.component.html',
  styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent implements OnInit, OnDestroy {
  person: PersonDetails;
  images: PeopleImages;
  knownFor: any[];
  credits: PersonCombinedCredits;
  personAge: number;
  isMobile$: Observable<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  links: ExternalIds;
  tabs: { title: string; value: string; visible: boolean }[] = [];
  activeTab: string = 'knownFor';
  private sub: Subscription;
  constructor(
    private sessionQuery: StateQuery,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.data.subscribe((data) => {
      this.scroller.scrollToPosition([0, 0]);
      this.images = data['images'];
      this.person = data['item'];
      this.links = data['socialLinks'];
      this.credits = data['credits'];
      this.knownFor = this.getKnownFor();
      this.titleService.setTitle(this.getTitle());
      this.personAge = this.getPersonAge();
      this.tabs = this.getTabs();
      this.stateService.setLoading(false);
    });
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private getTitle(): string {
    return `${this.person.name} | People`;
  }

  private getPersonAge(): number {
    const difference =
      ((this.person.deathday
        ? new Date(this.person.deathday)
        : new Date()
      ).getTime() -
        new Date(this.person.birthday).getTime()) /
      1000 /
      (60 * 60 * 24);
    return Math.abs(Math.round(difference / 365.25));
  }

  private getKnownFor(): any[] {
    const isActor = this.person.known_for_department === 'Acting';
    let credits = [];
    if (isActor) {
      credits = this.credits.cast;
    } else {
      credits = this.credits.crew.filter((v: any, i: number, s: any): any => {
        return i === s.findIndex((t: any) => t.id === v.id);
      });
    }
    return credits;
  }

  private getTabs() {
    return [
      { title: 'Known For', value: 'knownFor', visible: true },
      {
        title: 'Credits',
        value: 'credits',
        visible: this.knownFor.length > 0,
      },
      { title: 'Photos', value: 'photos', visible: true },
    ];
  }
}
