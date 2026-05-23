import { Injectable } from '@angular/core';

import { Observable, map, of, tap, throwError } from 'rxjs';

import {
    AccountAddFavoriteRequest,
    AccountStates,
    MovieRestControllerService,
    StatusResponse,
    TvEpisodeRestControllerService,
    TvSeriesRestControllerService,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { MediaType } from '../types';
import { normalizeRatingValue } from '../utils/rating';
import { UserSessionStoreService } from './user-session-store.service';

function extractUserRating(accountStates: AccountStates | null): number | null {
    const rated = accountStates?.rated;

    if (typeof rated === 'number') {
        return normalizeRatingValue(rated);
    }

    if (rated && typeof rated === 'object' && 'value' in rated) {
        const value = (rated as { value?: unknown }).value;
        if (typeof value === 'number') {
            return normalizeRatingValue(value);
        }
    }

    return null;
}

function toStatusError(prefix: string, response: StatusResponse): Error {
    return new Error(response.status_message || prefix);
}

@Injectable({ providedIn: 'root' })
export class MediaRatingService {
    constructor(
        private readonly movieService: MovieRestControllerService,
        private readonly tvEpisodeService: TvEpisodeRestControllerService,
        private readonly tvSeriesService: TvSeriesRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    getMediaRating$(mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>): Observable<number | null> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return of(null);
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAccountStates(
                      mediaId,
                      sessionId ?? undefined,
                      guestSessionId ?? undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieService.movieAccountStates(
                      mediaId,
                      sessionId ?? undefined,
                      guestSessionId ?? undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(map((accountStates) => extractUserRating(accountStates)));
    }

    getEpisodeRating$(seriesId: number, seasonNumber: number, episodeNumber: number): Observable<number | null> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return of(null);
        }

        return this.tvEpisodeService
            .tvEpisodeAccountStates(
                seriesId,
                seasonNumber,
                episodeNumber,
                sessionId ?? undefined,
                guestSessionId ?? undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(map((accountStates) => extractUserRating(accountStates)));
    }

    rateMedia$(mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>, value: number): Observable<void> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return throwError(() => new Error('You need a TMDb user session or guest session to rate.'));
        }

        const ratingValue = normalizeRatingValue(value);
        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAddRating(
                      mediaId,
                      'application/json',
                      guestSessionId ?? undefined,
                      sessionId ?? undefined,
                      { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieService.movieAddRating(
                      mediaId,
                      'application/json',
                      guestSessionId ?? undefined,
                      sessionId ?? undefined,
                      { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(
            tap((response) => {
                if ((response.status_code ?? 0) >= 400) {
                    throw toStatusError('Unable to save your rating.', response);
                }
            }),
            map(() => undefined),
        );
    }

    rateEpisode$(seriesId: number, seasonNumber: number, episodeNumber: number, value: number): Observable<void> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return throwError(() => new Error('You need a TMDb user session or guest session to rate.'));
        }

        const ratingValue = normalizeRatingValue(value);

        return this.tvEpisodeService
            .tvEpisodeAddRating(
                seriesId,
                'application/json',
                seasonNumber,
                episodeNumber,
                guestSessionId ?? undefined,
                sessionId ?? undefined,
                { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((response) => {
                    if ((response.status_code ?? 0) >= 400) {
                        throw toStatusError('Unable to save your rating.', response);
                    }
                }),
                map(() => undefined),
            );
    }

    deleteMediaRating$(mediaId: number, mediaType: Extract<MediaType, 'movie' | 'tv'>): Observable<void> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return throwError(() => new Error('You need a TMDb user session or guest session to remove a rating.'));
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesDeleteRating(
                      mediaId,
                      'application/json',
                      guestSessionId ?? undefined,
                      sessionId ?? undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  )
                : this.movieService.movieDeleteRating(
                      mediaId,
                      'application/json',
                      guestSessionId ?? undefined,
                      sessionId ?? undefined,
                      'body',
                      false,
                      API_JSON_OPTIONS,
                  );

        return request$.pipe(
            tap((response) => {
                if ((response.status_code ?? 0) >= 400) {
                    throw toStatusError('Unable to remove your rating.', response);
                }
            }),
            map(() => undefined),
        );
    }

    deleteEpisodeRating$(seriesId: number, seasonNumber: number, episodeNumber: number): Observable<void> {
        const sessionId = this.userSessionStore.sessionId();
        const guestSessionId = this.userSessionStore.guestSessionId();

        if (!sessionId && !guestSessionId) {
            return throwError(() => new Error('You need a TMDb user session or guest session to remove a rating.'));
        }

        return this.tvEpisodeService
            .tvEpisodeDeleteRating(
                seriesId,
                seasonNumber,
                episodeNumber,
                'application/json',
                guestSessionId ?? undefined,
                sessionId ?? undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((response) => {
                    if ((response.status_code ?? 0) >= 400) {
                        throw toStatusError('Unable to remove your rating.', response);
                    }
                }),
                map(() => undefined),
            );
    }
}
