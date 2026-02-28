import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { combineLatest, map } from 'rxjs';

import {
    CastCrewGridComponent,
    MediaThumbComponent,
    RatingComponent,
} from '../../../shared';
import { MinutesToHours } from '../../../shared/pipes/time.pipe';
import { MediaStoreService } from '../media-store.service';

@Component({
    selector: 'app-media-cast-crew',
    imports: [
        AsyncPipe,
        RouterLink,
        MatChipsModule,
        MediaThumbComponent,
        RatingComponent,
        CastCrewGridComponent,
        MinutesToHours,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './media-cast-crew.component.html',
    styleUrl: './media-cast-crew.component.scss',
})
export class MediaCastCrewComponent {
    readonly vm$ = this.mediaStoreService.viewModel$;

    readonly castCrew$ = combineLatest([
        this.mediaStoreService.cast$,
        this.mediaStoreService.crew$,
    ]).pipe(map(([cast, crew]) => ({ cast, crew })));

    constructor(public mediaStoreService: MediaStoreService) {}
}
