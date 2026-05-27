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
import { API_PRIVATE_JSON_OPTIONS } from '../../constants';
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

interface RatingRequestSession {
    readonly sessionId?: string;
    readonly guestSessionId?: string;
}

@Injectable({ providedIn: 'root' })
export class MediaRatingService {
    constructor(
        private readonly movieService: MovieRestControllerService,
        private readonly tvEpisodeService: TvEpisodeRestControllerService,
        private readonly tvSeriesService: TvSeriesRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    getMediaRating$(mediaId: number, mediaType: MediaType): Observable<number | null> {
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return of(null);
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAccountStates(
                      mediaId,
                      requestSession.sessionId,
                      requestSession.guestSessionId,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
                  )
                : this.movieService.movieAccountStates(
                      mediaId,
                      requestSession.sessionId,
                      requestSession.guestSessionId,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
                  );

        return request$.pipe(map((accountStates) => extractUserRating(accountStates)));
    }

    getEpisodeRating$(seriesId: number, seasonNumber: number, episodeNumber: number): Observable<number | null> {
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return of(null);
        }

        return this.tvEpisodeService
            .tvEpisodeAccountStates(
                seriesId,
                seasonNumber,
                episodeNumber,
                requestSession.sessionId,
                requestSession.guestSessionId,
                'body',
                false,
                API_PRIVATE_JSON_OPTIONS,
            )
            .pipe(map((accountStates) => extractUserRating(accountStates)));
    }

    rateMedia$(mediaId: number, mediaType: MediaType, value: number): Observable<void> {
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return throwError(() => new Error('You need a user session or guest session to rate.'));
        }

        const ratingValue = normalizeRatingValue(value);
        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesAddRating(
                      mediaId,
                      'application/json',
                      requestSession.guestSessionId,
                      requestSession.sessionId,
                      { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
                  )
                : this.movieService.movieAddRating(
                      mediaId,
                      'application/json',
                      requestSession.guestSessionId,
                      requestSession.sessionId,
                      { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
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
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return throwError(() => new Error('You need a user session or guest session to rate.'));
        }

        const ratingValue = normalizeRatingValue(value);

        return this.tvEpisodeService
            .tvEpisodeAddRating(
                seriesId,
                'application/json',
                seasonNumber,
                episodeNumber,
                requestSession.guestSessionId,
                requestSession.sessionId,
                { value: ratingValue } as unknown as AccountAddFavoriteRequest,
                'body',
                false,
                API_PRIVATE_JSON_OPTIONS,
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

    deleteMediaRating$(mediaId: number, mediaType: MediaType): Observable<void> {
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return throwError(() => new Error('You need a user session or guest session to remove a rating.'));
        }

        const request$ =
            mediaType === 'tv'
                ? this.tvSeriesService.tvSeriesDeleteRating(
                      mediaId,
                      'application/json',
                      requestSession.guestSessionId,
                      requestSession.sessionId,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
                  )
                : this.movieService.movieDeleteRating(
                      mediaId,
                      'application/json',
                      requestSession.guestSessionId,
                      requestSession.sessionId,
                      'body',
                      false,
                      API_PRIVATE_JSON_OPTIONS,
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
        const requestSession = this.getRequestSession();

        if (!requestSession) {
            return throwError(() => new Error('You need a user session or guest session to remove a rating.'));
        }

        return this.tvEpisodeService
            .tvEpisodeDeleteRating(
                seriesId,
                seasonNumber,
                episodeNumber,
                'application/json',
                requestSession.guestSessionId,
                requestSession.sessionId,
                'body',
                false,
                API_PRIVATE_JSON_OPTIONS,
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

    private getRequestSession(): RatingRequestSession | null {
        const sessionId = this.userSessionStore.sessionId() ?? undefined;
        const guestSessionId = this.userSessionStore.guestSessionId() ?? undefined;

        if (this.userSessionStore.mode() === 'guest' && guestSessionId) {
            return { guestSessionId };
        }

        if (sessionId) {
            return { sessionId };
        }

        if (guestSessionId) {
            return { guestSessionId };
        }

        return null;
    }
}
