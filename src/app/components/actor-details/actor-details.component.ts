import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SessionQuery } from '../../state/session.query';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { LoaderService } from '../../services';
import { get, set } from 'lodash';
import { IPerson } from '../../interfaces';

@Component({
  selector: 'app-actor-details',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actor-details.component.html',
  styleUrl: './actor-details.component.scss',
})
export class ActorDetailsComponent implements OnInit, OnDestroy {
  person: IPerson;
  credits: any;
  personAge: number;
  isMobile$: Observable<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  externalIds: any;
  private sub: Subscription;
  constructor(
    private sessionQuery: SessionQuery,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.data.subscribe((data) => {
      this.scroller.scrollToPosition([0, 0]);
      this.person = data['item'];
      this.externalIds = data['externalIds'];
      this.credits = this.getCredits(data);
      this.titleService.setTitle(this.getTitle());
      this.personAge = this.getPersonAge();
      this.loaderService.setLoading(false);
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

  private getCredits(data: any): any {
    const isActor = this.person.known_for_department === 'Acting';
    let credits = [];
    if (isActor) {
      credits = data['credits'].cast;
    } else {
      credits = data['credits'].crew.filter(
        (v: any, i: number, s: any): any => {
          return i === s.findIndex((t: any) => t.id === v.id);
        }
      );
    }
    return credits;
  }
}
