import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, EMPTY, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

import { CollectionDetails, CollectionRestControllerService, MovieRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import {
    LoadableItems,
    LoadableValue,
    MediaListItem,
    PersonLink,
    sortByDate,
    toCollectionPartMediaListItem,
} from '../../shared';

interface CollectionState {
    collection: LoadableValue<CollectionDetails | null>;
    parts: LoadableItems<MediaListItem>;
}

@Injectable()
export class CollectionStoreService extends ComponentStore<CollectionState> {
    private readonly opts = API_JSON_OPTIONS;

    collection$ = this.select((state) => state.collection);

    mappedPartsState$ = this.select((state) => state.parts);

    partsCount$ = this.select((state) => (state.parts.type === 'loaded' ? state.parts.value.length : 0));

    timelineLabel$ = this.select((state) => {
        if (state.parts.type !== 'loaded' || !state.parts.value.length) {
            return null;
        }

        const datedParts = state.parts.value.filter((part) => !!part.date);
        if (!datedParts.length) {
            return null;
        }

        const firstYear = datedParts[0].date;
        const lastYear = datedParts[datedParts.length - 1].date;
        return firstYear === lastYear ? firstYear : `${firstYear}-${lastYear}`;
    });

    backdropPath$ = this.collection$.pipe(
        map((state) => (state.type === 'loaded' && state.value ? state.value.backdrop_path : null)),
    );

    posterPath$ = this.collection$.pipe(
        map((state) => {
            if (state.type !== 'loaded' || !state.value) {
                return null;
            }

            return (
                state.value.poster_path ?? state.value.parts?.find((part) => !!part.poster_path)?.poster_path ?? null
            );
        }),
    );

    averageRating$ = this.select((state) => state.parts).pipe(
        map((parts) => {
            if (parts.type !== 'loaded') return 0;

            const rated = parts.value.filter((p) => (p.rating ?? 0) > 0);
            if (!rated.length) return 0;
            return rated.reduce((sum, p) => sum + (p.rating ?? 0), 0) / rated.length;
        }),
    );

    constructor(
        private collectionRestControllerService: CollectionRestControllerService,
        private movieRestControllerService: MovieRestControllerService,
        private router: Router,
    ) {
        super({
            collection: { type: 'idle' },
            parts: { type: 'loading' },
        });
    }

    getCollection$(id: number) {
        this.patchState({
            collection: { type: 'loading' },
            parts: { type: 'loading' },
        });
        return this.collectionRestControllerService
            .collectionDetails(id, undefined, undefined, undefined, this.opts)
            .pipe(
                switchMap((collection) => {
                    const mappedItems = sortByDate(collection.parts ?? [], (part) => part.release_date).map((part) =>
                        toCollectionPartMediaListItem(part, 'year'),
                    );

                    return this.enrichCastLinks$(withCollectionBadges(mappedItems)).pipe(
                        map((items) => ({ collection, items })),
                    );
                }),
                tap(({ collection, items }) =>
                    this.patchState({
                        collection: { type: 'loaded', value: collection },
                        parts: {
                            type: 'loaded',
                            value: items,
                        },
                    }),
                ),
                catchError(() => {
                    this.patchState({
                        collection: { type: 'loaded', value: null },
                        parts: { type: 'loaded', value: [] },
                    });
                    this.router.navigate(['not-found']);
                    return EMPTY;
                }),
            );
    }

    private enrichCastLinks$(items: MediaListItem[]): Observable<MediaListItem[]> {
        if (!items.length) {
            return of([]);
        }

        return forkJoin(
            items.map((item) =>
                this.fetchTopCast$(item.id).pipe(
                    map((castLinks) => ({ ...item, castLinks })),
                    catchError(() => of({ ...item, castLinks: [] })),
                ),
            ),
        );
    }

    private fetchTopCast$(mediaId: number): Observable<PersonLink[]> {
        return this.movieRestControllerService.movieCredits(mediaId, undefined, undefined, undefined, this.opts).pipe(
            map((credits) =>
                (credits.cast ?? [])
                    .filter((person): person is { id: number; name: string } => !!person.id && !!person.name)
                    .slice(0, 3)
                    .map((person) => ({
                        id: person.id,
                        name: person.name,
                    })),
            ),
        );
    }
}

function getHighestRatedPart(items: MediaListItem[]): MediaListItem | null {
    const ratedItems = items.filter((item) => (item.rating ?? 0) > 0);
    if (!ratedItems.length) {
        return null;
    }

    return ratedItems.reduce((best, current) => {
        const currentRating = current.rating ?? 0;
        const bestRating = best.rating ?? 0;

        if (currentRating !== bestRating) {
            return currentRating > bestRating ? current : best;
        }

        return (current.voteCount ?? 0) > (best.voteCount ?? 0) ? current : best;
    });
}

function withCollectionBadges(items: MediaListItem[]): MediaListItem[] {
    const highestRated = getHighestRatedPart(items);
    const latestReleased = getLatestReleasedPart(items);

    if (!highestRated && !latestReleased) {
        return items;
    }

    return items.map((item) => {
        const badges = [...(item.badges ?? [])];

        if (highestRated?.id === item.id) {
            badges.push({ label: 'Top rated', variant: 'accent' });
        }

        if (latestReleased?.id === item.id) {
            badges.push({ label: 'Latest', variant: 'neutral' });
        }

        return badges.length === (item.badges?.length ?? 0) ? item : { ...item, badges };
    });
}

function getLatestReleasedPart(items: MediaListItem[]): MediaListItem | null {
    const now = Date.now();
    const releasedItems = items.filter((item) => {
        if (!item.date) {
            return false;
        }

        const timestamp = Date.parse(item.date.length === 4 ? `${item.date}-01-01` : item.date);
        return !Number.isNaN(timestamp) && timestamp <= now;
    });

    if (!releasedItems.length) {
        return null;
    }

    return releasedItems.reduce((latest, current) => {
        const latestTimestamp = Date.parse(latest.date.length === 4 ? `${latest.date}-01-01` : latest.date);
        const currentTimestamp = Date.parse(current.date.length === 4 ? `${current.date}-01-01` : current.date);
        return currentTimestamp > latestTimestamp ? current : latest;
    });
}
