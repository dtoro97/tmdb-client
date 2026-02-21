import { get } from 'lodash';
import { map, Observable } from 'rxjs';
import { Cast, Crew } from 'tmdb-ts';

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ImagePipe } from '../../../shared';
import { MediaStoreService } from '../media-store.service';

@Component({
  selector: 'app-full-credits-page',
  imports: [AsyncPipe, RouterLink, ImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './full-credits-page.component.html',
  styleUrl: './full-credits-page.component.scss',
})
export class FullCreditsPageComponent {
  cast$: Observable<Cast[]>;
  crewByDepartment$: Observable<Record<string, Crew[]>>;
  crewDepartments$: Observable<string[]>;
  mediaType$: Observable<string>;
  mediaId$: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    public mediaStoreService: MediaStoreService,
  ) {
    this.cast$ = this.mediaStoreService.cast$;
    this.crewByDepartment$ = this.mediaStoreService.crewByDepartment$;
    this.crewDepartments$ = this.crewByDepartment$.pipe(
      map((grouped) => Object.keys(grouped)),
    );
    this.mediaType$ = this.route.params.pipe(
      map((params) => get(params, 'type')),
    );
    this.mediaId$ = this.route.params.pipe(
      map((params) => +get(params, 'id')),
    );
  }
}
