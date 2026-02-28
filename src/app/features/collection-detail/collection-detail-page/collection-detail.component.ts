import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';

import { switchMap, tap } from 'rxjs';

import { MediaThumbComponent, RatingComponent } from '../../../shared';
import { CollectionStoreService } from '../collection-store.service';

@Component({
    selector: 'app-collection-detail',
    templateUrl: './collection-detail.component.html',
    styleUrl: './collection-detail.component.scss',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MediaThumbComponent,
        RatingComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailComponent {
    constructor(
        public store: CollectionStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((params) =>
                    this.store.getCollection$(
                        Number(params.get('collectionId')),
                    ),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.collection$
            .pipe(
                tap((c) => this.titleService.setTitle(`${c.name} | Collection`)),
                takeUntilDestroyed(),
            )
            .subscribe();
    }
}
