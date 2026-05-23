import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, Observable, catchError, map, switchMap, take } from 'rxjs';

import { RATING_ACTIONS, RatingActions } from '../../types';
import { TmdbUserAuthService } from '../../services/tmdb-user-auth.service';
import { UserSessionStoreService } from '../../services/user-session-store.service';
import {
    MediaRatingDialogComponent,
    MediaRatingDialogResult,
} from '../media-rating-dialog/media-rating-dialog.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

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
        private readonly router: Router,
        private readonly snackBar: MatSnackBar,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
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
            return this.tmdbUserAuthService
                .startLogin$(this.router.url)
                .pipe(catchError((error) => this.showError('Could not start sign-in.')));
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
        this.snackBar.open(message, 'Dismiss', {
            duration: 5000,
            panelClass: 'snackbar-error',
        });
        return EMPTY;
    }
}
