import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { EMPTY, catchError, take } from 'rxjs';

import { SnackbarComponent, SnackbarService, SnackbarType, TmdbListService, UserSessionStoreService } from '../../index';
import type { MediaType } from '../../types';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { TmdbSigninDialogService } from '../tmdb-signin-dialog/tmdb-signin-dialog.service';

interface ToggleTarget {
    readonly mediaId: number;
    readonly mediaType: MediaType;
}

@Component({
    selector: 'app-watchlist-toggle',
    imports: [IconButtonComponent, MatButtonModule],
    template: `
        @if (iconOnly()) {
            <app-icon-button
                [ariaLabel]="isInWatchlist() ? title() + ' is on your watchlist' : 'Add ' + title() + ' to watchlist'"
                [disabled]="pending()"
                [selected]="isInWatchlist()"
                (onClick)="toggle()"
            >
                <i
                    [class.fa-solid]="isInWatchlist()"
                    [class.fa-regular]="!isInWatchlist()"
                    class="watchlist-toggle__icon watchlist-toggle__icon--only fa-bookmark"
                    aria-hidden="true"
                ></i>
            </app-icon-button>
        } @else {
            <button
                mat-stroked-button
                type="button"
                class="watchlist-toggle"
                [class.watchlist-toggle--active]="isInWatchlist()"
                [disabled]="pending()"
                [attr.aria-label]="isInWatchlist() ? title() + ' is on your watchlist' : 'Add ' + title() + ' to watchlist'"
                (click)="toggle($event)"
            >
                <i
                    [class.fa-solid]="isInWatchlist()"
                    [class.fa-regular]="!isInWatchlist()"
                    class="watchlist-toggle__icon fa-bookmark"
                    aria-hidden="true"
                ></i>
                <span class="watchlist-toggle__label">{{ watchlistLabel() }}</span>
            </button>
        }
    `,
    styleUrl: './watchlist-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistToggleComponent {
    readonly mediaId = input.required<number>();
    readonly mediaType = input.required<MediaType>();
    readonly title = input.required<string>();
    readonly iconOnly = input(false);

    readonly isInWatchlist = signal(false);
    readonly watchlistLabel = computed(() => (this.isInWatchlist() ? 'On Watchlist' : 'Add to Watchlist'));
    readonly pending = signal(false);

    private readonly target = computed<ToggleTarget | null>(() => {
        const mediaId = this.mediaId();
        const mediaType = this.mediaType();

        if (!mediaId || !mediaType) {
            return null;
        }

        return { mediaId, mediaType };
    });

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly snackbar: SnackbarService,
        private readonly tmdbListService: TmdbListService,
        private readonly tmdbSigninDialog: TmdbSigninDialogService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        effect((onCleanup) => {
            const target = this.target();

            if (!target) {
                this.isInWatchlist.set(false);
                this.pending.set(false);
                return;
            }

            this.isInWatchlist.set(false);
            this.pending.set(true);

            const subscription = this.tmdbListService
                .getWatchlistState$(target.mediaId, target.mediaType)
                .pipe(
                    take(1),
                    catchError(() => {
                        this.pending.set(false);
                        return EMPTY;
                    }),
                )
                .subscribe((inWatchlist) => {
                    this.isInWatchlist.set(inWatchlist);
                    this.pending.set(false);
                });

            onCleanup(() => {
                subscription.unsubscribe();
            });
        });
    }

    toggle(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();

        const target = this.target();

        if (!target || this.pending()) {
            return;
        }

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

        this.pending.set(true);

        const newValue = !this.isInWatchlist();

        this.tmdbListService
            .updateWatchlist$(target.mediaId, target.mediaType, newValue)
            .pipe(
                take(1),
                catchError(() => {
                    this.pending.set(false);
                    return this.showError('Could not update your watchlist.');
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.isInWatchlist.set(newValue);
                this.pending.set(false);
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
