import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Input, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { EMPTY, Subject, catchError, switchMap, take } from 'rxjs';

import { SnackbarComponent, SnackbarService, SnackbarType, TmdbListService, UserSessionStoreService } from '../../index';
import type { MediaType } from '../../types';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { TmdbSigninDialogService } from '../tmdb-signin-dialog/tmdb-signin-dialog.service';

@Component({
    selector: 'app-watchlist-toggle',
    imports: [IconButtonComponent, MatButtonModule],
    template: `
        @if (iconOnly) {
            <app-icon-button
                [ariaLabel]="isInWatchlist ? title + ' is on your watchlist' : 'Add ' + title + ' to watchlist'"
                [disabled]="pending"
                [selected]="isInWatchlist"
                (onClick)="toggle()"
            >
                <i
                    [class.fa-solid]="isInWatchlist"
                    [class.fa-regular]="!isInWatchlist"
                    class="watchlist-toggle__icon watchlist-toggle__icon--only fa-bookmark"
                    aria-hidden="true"
                ></i>
            </app-icon-button>
        } @else {
            <button
                mat-stroked-button
                type="button"
                class="watchlist-toggle"
                [class.watchlist-toggle--active]="isInWatchlist"
                [disabled]="pending"
                [attr.aria-label]="isInWatchlist ? title + ' is on your watchlist' : 'Add ' + title + ' to watchlist'"
                (click)="toggle($event)"
            >
                <i
                    [class.fa-solid]="isInWatchlist"
                    [class.fa-regular]="!isInWatchlist"
                    class="watchlist-toggle__icon fa-bookmark"
                    aria-hidden="true"
                ></i>
                <span class="watchlist-toggle__label">{{ watchlistLabel }}</span>
            </button>
        }
    `,
    styleUrl: './watchlist-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistToggleComponent implements OnChanges {
    @Input({ required: true }) mediaId!: number;
    @Input({ required: true }) mediaType!: MediaType;
    @Input({ required: true }) title!: string;
    @Input() iconOnly = false;
    isInWatchlist = false;
    watchlistLabel = 'Add to Watchlist';
    pending = false;

    private readonly refresh$ = new Subject<void>();

    constructor(
        private readonly cdr: ChangeDetectorRef,
        private readonly destroyRef: DestroyRef,
        private readonly snackbar: SnackbarService,
        private readonly tmdbListService: TmdbListService,
        private readonly tmdbSigninDialog: TmdbSigninDialogService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        this.refresh$
            .pipe(
                switchMap(() => this.tmdbListService.getWatchlistState$(this.mediaId, this.mediaType)),
                catchError(() => {
                    this.pending = false;
                    this.cdr.markForCheck();
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((inWatchlist) => {
                this.isInWatchlist = inWatchlist;
                this.watchlistLabel = inWatchlist ? 'On Watchlist' : 'Add to Watchlist';
                this.pending = false;
                this.cdr.markForCheck();
            });
    }

    ngOnChanges() {
        if (!this.mediaId || !this.mediaType) {
            return;
        }

        this.refresh$.next();
    }

    toggle(event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        if (!this.userSessionStore.isAuthenticated()) {
            this.tmdbSigninDialog
                .open$()
                .pipe(
                    take(1),
                    catchError(() => this.showError('Could not update your watchlist.')),
                    takeUntilDestroyed(this.destroyRef),
                )
                .subscribe();
            return;
        }

        this.pending = true;
        this.cdr.markForCheck();

        const newValue = !this.isInWatchlist;

        this.tmdbListService
            .updateWatchlist$(this.mediaId, this.mediaType, newValue)
            .pipe(
                take(1),
                catchError(() => {
                    this.pending = false;
                    this.cdr.markForCheck();
                    return this.showError('Could not update your watchlist.');
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.isInWatchlist = newValue;
                this.watchlistLabel = newValue ? 'On Watchlist' : 'Add to Watchlist';
                this.pending = false;
                this.cdr.markForCheck();
            });
    }

    private showError(message: string) {
        this.snackbar.openSnackbar(SnackbarComponent, {
            message,
            type: SnackbarType.Error,
        });
        return EMPTY;
    }
}
