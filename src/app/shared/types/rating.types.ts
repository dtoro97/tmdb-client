import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { LoadableValue } from './loadable.types';

export interface RatingVm {
    readonly value: LoadableValue<number | null>;
    readonly currentRating: number | null;
    readonly pending: boolean;
}

export interface RatingActions {
    readonly ratingVm$: Observable<RatingVm>;
    submitUserRating$(value: number): Observable<void>;
    deleteUserRating$(): Observable<void>;
    ensureGuestSessionForRating$(): Observable<void>;
}

export const RATING_ACTIONS = new InjectionToken<RatingActions>('RATING_ACTIONS');
