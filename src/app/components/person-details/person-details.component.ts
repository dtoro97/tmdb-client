import { get } from 'lodash';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { combineLatest, map, Observable, Subject, tap } from 'rxjs';
import {
  ExternalIds,
  Image,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { CommonModule, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { PersonQuery, StateQuery } from '../../core';
import { AgePipe, FilterPipe } from '../../shared';
import { ImagePipe } from '../../shared/pipes/image.pipe';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { CardComponent } from '../card/card.component';
import { CreditsListComponent } from '../credits-list/credits-list.component';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-person-details',
  imports: [
    ImagePipe,
    TabsModule,
    SelectModule,
    CommonModule,
    CardComponent,
    SortPipe,
    CreditsListComponent,
    FilterPipe,
    AgePipe,
    SocialLinksComponent,
    FormsModule,
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
  activeTab: string = 'knownFor';
  hasCredits$: Observable<boolean>;
  creditsOptions: any[];
  visibleCredits$: Observable<string | undefined>;
  private _visbileCredits: Subject<any> = new Subject();
  constructor(
    private stateQuery: StateQuery,
    private scroller: ViewportScroller,
    private titleService: Title,
    private personQuery: PersonQuery
  ) {}

  ngOnInit(): void {
    this.visibleCredits$ = this._visbileCredits.asObservable();
    this.isMobile = this.stateQuery.isMobile;
    this.isDarkMode$ = this.stateQuery.isDarkMode$;
    this.images$ = this.personQuery.images$;
    this.links$ = this.personQuery.socialLinks$;
    this.hasCredits$ = this.personQuery.hasCredits$;
    this.tabs$ = this.personQuery.combinedCredits$.pipe(
      map((credits) => this.getTabs(credits))
    );
    this.person$ = this.personQuery.person$.pipe(
      tap((person) => {
        this.titleService.setTitle(`${person.name} | People`);
        this.scroller.scrollToPosition([0, 0]);
      })
    );
    this.credits$ = this.personQuery.combinedCredits$.pipe(
      tap((credits: PersonCombinedCredits) => {
        this.setVisibleCredits(credits);
        this.setCreditsOptions(credits);
      })
    );
    this.knownFor$ = combineLatest([this.visibleCredits$, this.credits$]).pipe(
      map(([visible, credits]) => {
        if (visible) {
          return get(credits, visible);
        }
      })
    );
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
