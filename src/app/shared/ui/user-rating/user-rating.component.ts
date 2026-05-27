import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialog } from '@angular/material/dialog';

import { EMPTY, Observable, catchError, map, switchMap, take } from 'rxjs';

import { RATING_ACTIONS, RatingActions } from '../../types';
import { SnackbarService, SnackbarType } from '../../services/snackbar.service';
import { UserSessionStoreService } from '../../services/user-session-store.service';
import {
    MediaRatingDialogComponent,
    MediaRatingDialogResult,
} from '../media-rating-dialog/media-rating-dialog.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { TmdbSigninDialogService } from '../tmdb-signin-dialog/tmdb-signin-dialog.service';

interface UserRatingViewModel {
    readonly currentRating: number | null;
    readonly disabled: boolean;
    readonly loading: boolean;
    readonly pending: boolean;
}

@Component({
    selector: 'app-user-rating',
    imports: [AsyncPipe, DecimalPipe, SkeletonComponent],
    templateUrl: './user-rating.component.html',
    styleUrl: './user-rating.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRatingComponent {
    @Input({ required: true }) title!: string;

    readonly vm$ = this.ratingActions.ratingVm$.pipe(
        map((rating): UserRatingViewModel => {
            const loading = rating.value.type === 'loading' || rating.value.type === 'idle';

            return {
                currentRating: rating.currentRating,
                disabled: rating.pending || loading,
                loading,
                pending: rating.pending,
            };
        }),
    );

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly dialog: MatDialog,
        @Inject(RATING_ACTIONS) private readonly ratingActions: RatingActions,
        private readonly snackbar: SnackbarService,
        private readonly tmdbSigninDialog: TmdbSigninDialogService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    open(): void {
        this.ratingActions.ratingVm$
            .pipe(
                take(1),
                switchMap((rating) => {
                    if (rating.pending || rating.value.type === 'loading' || rating.value.type === 'idle') {
                        return EMPTY;
                    }

                    return this.dialog
                        .open(MediaRatingDialogComponent, {
                            data: {
                                title: this.title,
                                currentRating: rating.currentRating,
                                authMode: this.userSessionStore.mode(),
                            },
                            maxWidth: '36rem',
                            width: '100%',
                        })
                        .afterClosed()
                        .pipe(
                            take(1),
                            switchMap((result: MediaRatingDialogResult | undefined) => this.handleDialogResult(result)),
                        );
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private handleDialogResult(result: MediaRatingDialogResult | undefined): Observable<unknown> {
        if (result === undefined) {
            return EMPTY;
        }

        if (result === 'remove') {
            return this.ratingActions
                .deleteUserRating$()
                .pipe(catchError(() => this.showError('Could not remove your rating.')));
        }

        if (result === 'login') {
            return this.tmdbSigninDialog.open$().pipe(catchError(() => this.showError('Could not start sign-in.')));
        }

        if (typeof result === 'object' && 'guestValue' in result) {
            return this.ratingActions.ensureGuestSessionForRating$().pipe(
                switchMap(() => this.ratingActions.submitUserRating$(result.guestValue)),
                catchError(() => this.showError('Could not save your rating.')),
            );
        }

        if (typeof result === 'number') {
            return this.ratingActions
                .submitUserRating$(result)
                .pipe(catchError(() => this.showError('Could not save your rating.')));
        }

        return EMPTY;
    }

    private showError(message: string): Observable<never> {
        this.snackbar.openSnackbar(SnackbarComponent, {
            message,
            type: SnackbarType.Error,
        });
        return EMPTY;
    }
}
