import { Component, OnDestroy, OnInit } from '@angular/core';
import { SessionQuery } from '../../state/session.query';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';

@Component({
  selector: 'app-actor-details',
  standalone: false,

  templateUrl: './actor-details.component.html',
  styleUrl: './actor-details.component.scss',
})
export class ActorDetailsComponent implements OnInit, OnDestroy {
  actor: any;
  credits: any;
  actorAge: number;
  isMobile$: Observable<boolean>;
  isDarkMode$: Observable<boolean>;
  breakpoints = CAROUSEL_BREAKPOINTS;
  private sub: Subscription;
  constructor(
    private sessionQuery: SessionQuery,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.sub = this.route.data.subscribe((data) => {
      this.actor = data['item'];
      this.credits = this.getCredits(data);
      this.scroller.scrollToPosition([0, 0]);
      this.titleService.setTitle(this.getTitle());
      this.actorAge = this.getActorAge();
      console.log(this.credits);
    });
    this.isMobile$ = this.sessionQuery.isMobile$;
    this.isDarkMode$ = this.sessionQuery.isDarkMode$;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private getTitle(): string {
    return `${this.actor.name} | People`;
  }

  private getActorAge(): number {
    const difference =
      ((this.actor.deathday
        ? new Date(this.actor.deathday)
        : new Date()
      ).getTime() -
        new Date(this.actor.birthday).getTime()) /
      1000 /
      (60 * 60 * 24);
    return Math.abs(Math.round(difference / 365.25));
  }

  private getCredits(data: any): any {
    const isActor = this.actor.known_for_department === 'Acting';
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
