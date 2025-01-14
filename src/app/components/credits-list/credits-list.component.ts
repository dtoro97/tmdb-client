import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { Cast, Crew, PersonCombinedCredits } from 'tmdb-ts';

@Component({
  selector: 'app-credits-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credits-list.component.html',
  styleUrl: './credits-list.component.scss',
})
export class CreditsListComponent {
  @Input() set credits(credits: PersonCombinedCredits) {
    console.log(credits);
    this._credits = credits;
    this.department$ = this._department.asObservable();
    this.media$ = this._media.asObservable();
    this.data$ = combineLatest([
      this.department$,
      this.media$,
      of(credits),
    ]).pipe(
      map(([department, media, credits]) => {
        console.log(credits);
        /* if (department === 'acting') {
          return credits.cast.filter((c) =>
            media === 'all' ? true : c.media_type === media
          );
        } else if (department === 'production') {
          return credits.crew.filter((c) =>
            media === 'all' ? true : c.media_type === media
          );
        } */
        return [...credits.cast, ...credits.crew];
      })
    );
    this.departmentLabel$ = this.department$.pipe(
      map(
        (department) =>
          this.departmentOptions.find((o) => o.value === department)!.label
      )
    );
    this.data$.subscribe((v) => {
      console.log(v);
    });
  }

  get credits(): PersonCombinedCredits {
    return this._credits;
  }

  private _credits: PersonCombinedCredits;
  department$: Observable<string>;
  media$: Observable<string>;
  data$: Observable<any[]>;
  private _department: BehaviorSubject<string> = new BehaviorSubject('all');
  private _media: BehaviorSubject<string> = new BehaviorSubject('all');
  departmentOptions = [
    { label: 'All', value: 'all' },
    { label: 'Acting', value: 'acting' },
    { label: 'Production', value: 'production' },
  ];
  mediaOptions = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'movie' },
    { label: 'TV Shows', value: 'tv' },
  ];
  departmentEnabled = false;
  mediaEnabled = false;
  departmentLabel$: Observable<string>;

  changeDepartment(value: any): void {
    console.log(value);
    this._department.next(value);
  }

  changeMedia(value: any): void {
    console.log(value);
    this._media.next(value);
  }
}
