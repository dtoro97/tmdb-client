import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import {
    EMPTY,
    Observable,
    catchError,
    debounceTime,
    distinctUntilChanged,
    forkJoin,
    map,
    of,
    switchMap,
    tap,
    throwError,
} from 'rxjs';

import { MultiListItem, SearchRestControllerService } from '../../../api';
import { API_JSON_OPTIONS } from '../../../constants';
import { LoadableItems, LocaleStoreService, MediaType, TmdbListService, updateLoadedItems } from '../../../shared';
import { toLoadedItems } from '../../../shared/utils';

export interface UserListAddItemsSearchResult {
    readonly key: string;
    readonly id: number;
    readonly mediaType: MediaType;
    readonly title: string;
    readonly year: string;
    readonly posterPath: string | null;
    readonly isAdded: boolean;
}

interface UserListAddItemsDialogState {
    readonly listId: number | null;
    readonly addedKeys: readonly string[];
    readonly query: string;
    readonly resultsState: LoadableItems<UserListAddItemsSearchResult>;
    readonly errorMessage: string | null;
    readonly hasChanges: boolean;
}

const INITIAL_STATE: UserListAddItemsDialogState = {
    listId: null,
    addedKeys: [],
    query: '',
    resultsState: { type: 'idle' },
    errorMessage: null,
    hasChanges: false,
};

@Injectable()
export class UserListAddItemsDialogStore extends ComponentStore<UserListAddItemsDialogState> {
    readonly vm$ = this.select((state) => ({
        state: state.resultsState,
        errorMessage: state.errorMessage,
        hasChanges: state.hasChanges,
    }));

    private readonly query$ = this.select((state) => state.query);
    private readonly searchTitles = this.effect((query$: Observable<string>) =>
        query$.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            switchMap((query) => {
                if (!query) {
                    this.patchState({ resultsState: { type: 'idle' } });
                    return of(null);
                }

                this.patchState({ resultsState: { type: 'loading' } });

                return this.search$(query).pipe(
                    catchError(() => {
                        this.patchState({
                            errorMessage: 'Search failed. Try another title.',
                            resultsState: toLoadedItems([]),
                        });
                        return of(null);
                    }),
                );
            }),
            tap((results) => {
                if (results !== null) {
                    this.patchState({ resultsState: toLoadedItems(results) });
                }
            }),
        ),
    );

    constructor(
        private readonly localeStore: LocaleStoreService,
        private readonly searchService: SearchRestControllerService,
        private readonly tmdbListService: TmdbListService,
    ) {
        super(INITIAL_STATE);
        this.searchTitles(this.query$);
    }

    initialize(data: { readonly listId: number; readonly existingKeys: readonly string[] }): void {
        this.patchState({
            listId: data.listId,
            addedKeys: [...data.existingKeys],
        });
    }

    updateQuery(query: string): void {
        const nextQuery = query.trim();

        this.patchState({
            query: nextQuery,
            errorMessage: null,
            resultsState: nextQuery ? this.get().resultsState : { type: 'idle' },
        });
    }

    addItem$(item: UserListAddItemsSearchResult) {
        const { listId } = this.get();

        if (item.isAdded) {
            return of(undefined);
        }

        if (listId === null) {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService.addToList$(listId, item.id, item.mediaType).pipe(
            tap(() => {
                this.patchState((state) => ({
                    hasChanges: true,
                    addedKeys: [...state.addedKeys, item.key],
                    resultsState: updateLoadedItems(state.resultsState, (items) =>
                        items.map((result) => (result.key === item.key ? { ...result, isAdded: true } : result)),
                    ),
                }));
            }),
            catchError(() => {
                this.patchState({ errorMessage: 'Could not add this title.' });
                return EMPTY;
            }),
        );
    }

    hasChanges(): boolean {
        return this.get().hasChanges;
    }

    private search$(query: string) {
        return this.searchService
            .searchMulti(query, undefined, this.localeStore.language(), 1, 'body', false, API_JSON_OPTIONS)
            .pipe(
                map((page) =>
                    (page.results ?? [])
                        .map((item) => this.toSearchResult(item))
                        .filter((item): item is UserListAddItemsSearchResult => item !== null),
                ),
                switchMap((results) => this.addListStatusToResults$(results)),
            );
    }

    private addListStatusToResults$(results: readonly UserListAddItemsSearchResult[]) {
        const { listId } = this.get();

        if (listId === null || results.length === 0) {
            return of([] as UserListAddItemsSearchResult[]);
        }

        return forkJoin(
            results.map((item) =>
                this.get().addedKeys.includes(item.key)
                    ? of({ ...item, isAdded: true })
                    : this.tmdbListService
                          .getListItemStatus$(listId, item.id, item.mediaType)
                          .pipe(map((isAdded) => ({ ...item, isAdded }))),
            ),
        );
    }

    private toSearchResult(item: MultiListItem): UserListAddItemsSearchResult | null {
        if (
            item.media_type !== MultiListItem.MediaTypeEnum.Movie &&
            item.media_type !== MultiListItem.MediaTypeEnum.Tv
        ) {
            return null;
        }

        const mediaType: MediaType = item.media_type === MultiListItem.MediaTypeEnum.Tv ? 'tv' : 'movie';
        const title = mediaType === 'movie' ? item.title : item.name;

        if (!item.id || !title) {
            return null;
        }

        const key = `${mediaType}:${item.id}`;
        const date = mediaType === 'movie' ? (item.release_date ?? '') : (item.first_air_date ?? '');

        return {
            key,
            id: item.id,
            mediaType,
            title,
            year: date.slice(0, 4),
            posterPath: item.poster_path ?? null,
            isAdded: this.get().addedKeys.includes(key),
        };
    }
}
