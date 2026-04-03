import { Injectable } from '@angular/core';

import { Observable, map, of, switchMap, tap, throwError } from 'rxjs';

import {
    AccountListItem,
    AccountRestControllerService,
    ListRestControllerService,
    MovieRestControllerService,
    StatusResponse,
    TvSeriesRestControllerService,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { MediaType } from '../types';
import { buildRawBody } from '../utils/api-body';
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

function toStatusError(prefix: string, response: StatusResponse): Error {
    return new Error(response.status_message || prefix);
}

function toMediaUserListSummary(
    list: AccountListItem,
): MediaUserListSummary | null {
    if (!list.id || !list.name?.trim()) {
        return null;
    }

    return {
        id: list.id,
        name: list.name.trim(),
        description: list.description?.trim() || null,
        itemCount: list.item_count ?? 0,
        favoriteCount: list.favorite_count ?? null,
        posterPath: list.poster_path ?? null,
    };
}

@Injectable({ providedIn: 'root' })
export class TmdbListService {
    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly listService: ListRestControllerService,
        private readonly movieService: MovieRestControllerService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly tvSeriesService: TvSeriesRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    getWatchlistState$(
        mediaId: number,
        mediaType: Extract<MediaType, 'movie' | 'tv'>,
    ): Observable<boolean> {
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
                : this.movieService.movieAccountStates(
                      mediaId,
                      sessionId,
                      undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

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
                    return throwError(
                        () =>
                            new Error(
                                'You need a TMDb user session to update your watchlist.',
                            ),
                    );
                }

                return this.accountService
                    .accountAddToWatchlist(
                        accountId,
                        sessionId,
                        buildRawBody({
                            media_type: mediaType,
                            media_id: mediaId,
                            watchlist,
                        }),
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    )
                    .pipe(
                        tap((response) => {
                            if ((response.status_code ?? 0) >= 400) {
                                throw toStatusError(
                                    'Unable to update your watchlist.',
                                    response,
                                );
                            }
                        }),
                        map(() => watchlist),
                    );
            }),
        );
    }

    getFavoriteState$(
        mediaId: number,
        mediaType: Extract<MediaType, 'movie' | 'tv'>,
    ): Observable<boolean> {
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
                : this.movieService.movieAccountStates(
                      mediaId,
                      sessionId,
                      undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

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
                    return throwError(
                        () =>
                            new Error(
                                'You need a TMDb user session to update your favorites.',
                            ),
                    );
                }

                return this.accountService
                    .accountAddFavorite(
                        accountId,
                        sessionId,
                        buildRawBody({
                            media_type: mediaType,
                            media_id: mediaId,
                            favorite,
                        }),
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    )
                    .pipe(
                        tap((response) => {
                            if ((response.status_code ?? 0) >= 400) {
                                throw toStatusError(
                                    'Unable to update your favorites.',
                                    response,
                                );
                            }
                        }),
                        map(() => favorite),
                    );
            }),
        );
    }

    getUserLists$(): Observable<MediaUserListSummary[]> {
        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(({ accountId }) => {
                const sessionId = this.userSessionStore.sessionId();

                if (!sessionId) {
                    return throwError(
                        () =>
                            new Error(
                                'You need a TMDb user session to access your lists.',
                            ),
                    );
                }

                return this.accountService.accountLists(
                    accountId,
                    1,
                    sessionId,
                    'body',
                    false,
                    API_JSON_OPTIONS,
                );
            }),
            map((page) =>
                (page.results ?? [])
                    .map((list) => toMediaUserListSummary(list))
                    .filter(
                        (list): list is MediaUserListSummary => list !== null,
                    )
                    .slice(0, 5),
            ),
        );
    }

    addToList$(listId: number, mediaId: number): Observable<void> {
        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(() => {
                const sessionId = this.userSessionStore.sessionId();

                if (!sessionId) {
                    return throwError(
                        () =>
                            new Error(
                                'You need a TMDb user session to add items to lists.',
                            ),
                    );
                }

                return this.listService
                    .listAddMovie(
                        listId,
                        sessionId,
                        buildRawBody({ media_id: mediaId }),
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    )
                    .pipe(
                        tap((response) => {
                            if ((response.status_code ?? 0) >= 400) {
                                throw toStatusError(
                                    'Unable to update your list.',
                                    response,
                                );
                            }
                        }),
                        map(() => undefined),
                    );
            }),
        );
    }
}
