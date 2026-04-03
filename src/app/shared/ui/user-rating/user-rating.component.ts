import { AsyncPipe, DecimalPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Inject,
    Input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, catchError, switchMap, take } from 'rxjs';

import { RATING_ACTIONS, RatingActions } from '../../types';
import { toUserFacingErrorMessage } from '../../utils';
import { TmdbUserAuthService } from '../../services/tmdb-user-auth.service';
import { UserSessionStoreService } from '../../services/user-session-store.service';
import { MediaRatingDialogComponent, MediaRatingDialogResult } from '../media-rating-dialog/media-rating-dialog.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-user-rating',
    imports: [AsyncPipe, DecimalPipe, MatIconModule, SkeletonComponent],
    templateUrl: './user-rating.component.html',
    styleUrl: './user-rating.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRatingComponent {
    @Input({ required: true }) title!: string;

    readonly rating$ = this.ratingActions.ratingVm$;

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
        this.rating$
            .pipe(
                take(1),
                switchMap((rating) => {
                    if (
                        rating.pending ||
                        rating.value.type === 'loading' ||
                        rating.value.type === 'idle'
                    ) {
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
                            switchMap(
                                (result: MediaRatingDialogResult | undefined) =>
                                    this.handleDialogResult(result),
                            ),
                        );
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private handleDialogResult(result: MediaRatingDialogResult | undefined) {
        if (result === undefined) {
            return EMPTY;
        }

        if (result === 'remove') {
            return this.ratingActions
                .deleteUserRating$()
                .pipe(
                    catchError((error) =>
                        this.showError(error, 'Could not remove your rating.'),
                    ),
                );
        }

        if (result === 'login') {
            return this.tmdbUserAuthService
                .startLogin$(this.router.url)
                .pipe(
                    catchError((error) =>
                        this.showError(error, 'Could not start sign-in.'),
                    ),
                );
        }

        if (typeof result === 'object' && 'guestValue' in result) {
            return this.ratingActions
                .ensureGuestSessionForRating$()
                .pipe(
                    switchMap(() =>
                        this.ratingActions.submitUserRating$(result.guestValue),
                    ),
                    catchError((error) =>
                        this.showError(error, 'Could not save your rating.'),
                    ),
                );
        }

        if (typeof result === 'number') {
            return this.ratingActions
                .submitUserRating$(result)
                .pipe(
                    catchError((error) =>
                        this.showError(error, 'Could not save your rating.'),
                    ),
                );
        }

        return EMPTY;
    }

    private showError(error: unknown, fallback: string) {
        this.snackBar.open(
            toUserFacingErrorMessage(error, fallback),
            'Dismiss',
            { duration: 5000, panelClass: 'snackbar-error' },
        );
        return EMPTY;
    }
}
