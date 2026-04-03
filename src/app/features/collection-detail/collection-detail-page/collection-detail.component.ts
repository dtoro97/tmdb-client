import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';

import { switchMap, tap } from 'rxjs';

import {
    HeroSurfaceComponent,
    MediaListComponent,
    ImageComponent,
    RatingComponent,
    SkeletonComponent,
} from '../../../shared';
import { CollectionStoreService } from '../collection-store.service';

@Component({
    selector: 'app-collection-detail',
    templateUrl: './collection-detail.component.html',
    styleUrl: './collection-detail.component.scss',
    imports: [
        AsyncPipe,
        HeroSurfaceComponent,
        ImageComponent,
        RatingComponent,
        MediaListComponent,
        SkeletonComponent,
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
                tap((collectionState) => {
                    if (
                        collectionState.type === 'loaded' &&
                        collectionState.value?.name
                    ) {
                        this.titleService.setTitle(
                            `${collectionState.value.name} | Collection`,
                        );
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }
}
