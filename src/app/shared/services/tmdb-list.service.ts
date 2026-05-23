import { Injectable } from '@angular/core';

import { Observable, map, of, switchMap, tap, throwError } from 'rxjs';

import {
    AccountAddFavoriteRequest,
    AccountRestControllerService,
    MovieRestControllerService,
    StatusResponse,
    TvSeriesRestControllerService,
} from '../../api';
import {
    AccountService as AccountV4Service,
    ListService as ListV4Service,
    V4CreateListRequest,
    V4ListDetails,
    V4ListItemInput,
    V4ListSortBy,
    V4StatusResponse,
    V4UpdateListRequest,
} from '../../api-v4';
import { API_JSON_OPTIONS } from '../../constants';
import { MediaType } from '../types';
import { LocaleStoreService } from './locale-store.service';
import { TmdbUserAccountService } from './tmdb-user-account.service';
import { UserSessionStoreService } from './user-session-store.service';

export interface MediaUserListSummary {
    id: number;
    name: string;
    description: string | null;
    itemCount: number;
    favoriteCount: number | null;
    posterPath: string | null;
}

function toStatusError(prefix: string, response: StatusResponse | V4StatusResponse): Error {
    return new Error(response.status_message || prefix);
}

function ensureSuccessfulV4Status(response: V4StatusResponse, prefix: string): void {
    if (!response.success || (response.status_code ?? 0) >= 400) {
        throw toStatusError(prefix, response);
    }
}

@Injectable({ providedIn: 'root' })
export class TmdbListService {
    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly accountV4Service: AccountV4Service,
        private readonly listV4Service: ListV4Service,
        private readonly localeStore: LocaleStoreService,
        private readonly movieService: MovieRestControllerService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly tvSeriesService: TvSeriesRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    private ensureV4ListAccess(): void {
        if (!this.userSessionStore.v4AccessToken()) {
            throw new Error('Please sign in to TMDb again to grant custom list access.');
        }
    }

    private requireV4AccountId(): string {
        const v4AccountId = this.userSessionStore.v4AccountId();

        if (!v4AccountId) {
            throw new Error('Please sign in to TMDb again to load your custom lists.');
        }

        return v4AccountId;
    }

    getWatchlistState$(mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>): Observable<boolean> {
        const sessionId = this.userSessionStore.sessionId();

        if (!sessionId || this.userSessionStore.mode() !== 'user') {
            return of(false);
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAccountStates(
                      mediaId,
                      sessionId,
                      undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieService.movieAccountStates(mediaId, sessionId, undefined, 'body', false, API_JSON_OPTIONS);

        return request$.pipe(map((accountStates) => !!accountStates.watchlist));
    }

    updateWatchlist$(
        mediaId: number,
        mediaType: Extract<MediaType, 'movie' | 'tv'>,
        watchlist: boolean,
    ): Observable<boolean> {
        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(({ accountId }) => {
                const sessionId = this.userSessionStore.sessionId();

                if (!sessionId) {
                    return throwError(() => new Error('You need a TMDb user session to update your watchlist.'));
                }

                return this.accountService
                    .accountAddToWatchlist(
                        accountId,
                        sessionId,
                        {
                            media_type: mediaType,
                            media_id: mediaId,
                            watchlist,
                        } as unknown as AccountAddFavoriteRequest,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    )
                    .pipe(
                        tap((response) => {
                            if ((response.status_code ?? 0) >= 400) {
                                throw toStatusError('Unable to update your watchlist.', response);
                            }
                        }),
                        map(() => watchlist),
                    );
            }),
        );
    }

    getFavoriteState$(mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>): Observable<boolean> {
        const sessionId = this.userSessionStore.sessionId();

        if (!sessionId || this.userSessionStore.mode() !== 'user') {
            return of(false);
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAccountStates(
                      mediaId,
                      sessionId,
                      undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieService.movieAccountStates(mediaId, sessionId, undefined, 'body', false, API_JSON_OPTIONS);

        return request$.pipe(map((accountStates) => !!accountStates.favorite));
    }

    updateFavorite$(
        mediaId: number,
        mediaType: Extract<MediaType, 'movie' | 'tv'>,
        favorite: boolean,
    ): Observable<boolean> {
        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(({ accountId }) => {
                const sessionId = this.userSessionStore.sessionId();

                if (!sessionId) {
                    return throwError(() => new Error('You need a TMDb user session to update your favorites.'));
                }

                return this.accountService
                    .accountAddFavorite(
                        accountId,
                        sessionId,
                        {
                            media_type: mediaType,
                            media_id: mediaId,
                            favorite,
                        } as unknown as AccountAddFavoriteRequest,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    )
                    .pipe(
                        tap((response) => {
                            if ((response.status_code ?? 0) >= 400) {
                                throw toStatusError('Unable to update your favorites.', response);
                            }
                        }),
                        map(() => favorite),
                    );
            }),
        );
    }

    getUserLists$(): Observable<MediaUserListSummary[]> {
        this.ensureV4ListAccess();
        const v4AccountId = this.requireV4AccountId();

        return this.accountV4Service.accountV4Lists(v4AccountId, 1, 'body', false, API_JSON_OPTIONS).pipe(
            map((page) =>
                (page.results ?? [])
                    .map((list) => {
                        if (!list.id || !list.name?.trim()) {
                            return null;
                        }

                        const summary: MediaUserListSummary = {
                            id: list.id,
                            name: list.name.trim(),
                            description: list.description?.trim() || null,
                            itemCount: list.number_of_items ?? 0,
                            favoriteCount: null,
                            posterPath: list.poster_path ?? null,
                        };

                        return summary;
                    })
                    .filter((list) => list !== null),
            ),
        );
    }

    getListDetails$(listId: number, page = 1, sortBy?: V4ListSortBy): Observable<V4ListDetails> {
        this.ensureV4ListAccess();

        return this.listV4Service.listV4Details(
            listId,
            this.localeStore.language(),
            sortBy,
            page,
            'body',
            false,
            API_JSON_OPTIONS,
        );
    }

    createList$(name: string, description = ''): Observable<number> {
        this.ensureV4ListAccess();

        const createListRequest = {
            name: name.trim(),
            description: description.trim(),
            iso_639_1: this.localeStore.language(),
        } as V4CreateListRequest & { iso_639_1: string };

        return this.listV4Service.listV4Create(createListRequest, 'body', false, API_JSON_OPTIONS).pipe(
            map((response) => {
                if (!response.success || (response.status_code ?? 0) >= 400 || !response.id) {
                    throw toStatusError('Unable to create your list.', response);
                }

                return response.id;
            }),
        );
    }

    addToList$(listId: number, mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>): Observable<void> {
        this.ensureV4ListAccess();

        return this.listV4Service
            .listV4AddItems(
                listId,
                {
                    items: [{ media_id: mediaId, media_type: mediaType }],
                },
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((response) => {
                    if ((response.status_code ?? 0) >= 400) {
                        throw toStatusError('Unable to update your list.', response);
                    }
                }),
                map(() => undefined),
            );
    }

    updateList$(listId: number, request: V4UpdateListRequest): Observable<void> {
        this.ensureV4ListAccess();

        return this.listV4Service.listV4Update(listId, request, 'body', false, API_JSON_OPTIONS).pipe(
            tap((response) => ensureSuccessfulV4Status(response, 'Unable to update your list.')),
            map(() => undefined),
        );
    }

    clearList$(listId: number): Observable<void> {
        this.ensureV4ListAccess();

        return this.listV4Service.listV4Clear(listId, 'body', false, API_JSON_OPTIONS).pipe(
            tap((response) => ensureSuccessfulV4Status(response, 'Unable to clear your list.')),
            map(() => undefined),
        );
    }

    deleteList$(listId: number): Observable<void> {
        this.ensureV4ListAccess();

        return this.listV4Service.listV4Delete(listId, 'body', false, API_JSON_OPTIONS).pipe(
            tap((response) => ensureSuccessfulV4Status(response, 'Unable to delete your list.')),
            map(() => undefined),
        );
    }

    removeItems$(listId: number, items: readonly V4ListItemInput[]): Observable<void> {
        this.ensureV4ListAccess();

        return this.listV4Service
            .listV4RemoveItems(listId, { items: [...items] }, 'body', false, API_JSON_OPTIONS)
            .pipe(
                tap((response) => ensureSuccessfulV4Status(response, 'Unable to update your list.')),
                map(() => undefined),
            );
    }

    createListAndAdd$(
        name: string,
        description: string,
        mediaId: number,
        mediaType: Extract<MediaType, 'movie' | 'tv'>,
    ): Observable<void> {
        return this.createList$(name, description).pipe(
            switchMap((listId) => this.addToList$(listId, mediaId, mediaType)),
        );
    }
}
