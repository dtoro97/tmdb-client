import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { catchError, EMPTY, filter, map, Observable, tap } from 'rxjs';

import {
    CollectionDetails,
    CollectionPart,
    CollectionRestControllerService,
} from '../../api';
import { isDefined, loader } from '../../shared';

interface CollectionState {
    collection?: CollectionDetails;
}

@Injectable()
export class CollectionStoreService extends ComponentStore<CollectionState> {
    collection$ = this.select((state) => state.collection).pipe(
        filter(isDefined),
    );

    parts$: Observable<CollectionPart[]> = this.collection$.pipe(
        map((c) =>
            [...(c.parts ?? [])].sort(
                (a, b) =>
                    (a.release_date ?? '').localeCompare(b.release_date ?? ''),
            ),
        ),
    );

    partsCount$ = this.parts$.pipe(map((parts) => parts.length));

    backdropPath$ = this.collection$.pipe(map((c) => c.backdrop_path));

    averageRating$ = this.parts$.pipe(
        map((parts) => {
            const rated = parts.filter((p) => (p.vote_average ?? 0) > 0);
            if (!rated.length) return 0;
            return (
                rated.reduce((sum, p) => sum + (p.vote_average ?? 0), 0) /
                rated.length
            );
        }),
    );

    constructor(
        private collectionRestControllerService: CollectionRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
        private router: Router,
    ) {
        super({});
    }

    getCollection$(id: number) {
        return this.collectionRestControllerService
            .collectionDetails(id, undefined, undefined, undefined, {
                httpHeaderAccept: 'application/json',
            })
            .pipe(
                loader(this.ngxUiLoaderService),
                tap((collection) => this.patchState({ collection })),
                catchError(() => {
                    this.router.navigate(['not-found']);
                    return EMPTY;
                }),
            );
    }
}
