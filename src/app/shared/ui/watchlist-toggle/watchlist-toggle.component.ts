import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    Input,
    OnChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EMPTY, Subject, catchError, switchMap, take } from 'rxjs';

import {
    TmdbListService,
    TmdbUserAuthService,
    UserSessionStoreService,
    toUserFacingErrorMessage,
} from '../../index';
import type { MediaType } from '../../types';

@Component({
    selector: 'app-watchlist-toggle',
    imports: [MatButtonModule, MatTooltipModule],
    template: `
        @if (variant === 'icon') {
            <button
                mat-icon-button
                type="button"
                class="watchlist-toggle"
                [class.watchlist-toggle--active]="isInWatchlist"
                [disabled]="pending"
                [attr.aria-label]="
                    isInWatchlist
                        ? title + ' is on your watchlist'
                        : 'Add ' + title + ' to watchlist'
                "
                [matTooltip]="
                    isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'
                "
                (click)="toggle($event)"
            >
                <i
                    [class.fa-solid]="isInWatchlist"
                    [class.fa-regular]="!isInWatchlist"
                    class="fa-bookmark"
                    aria-hidden="true"
                ></i>
            </button>
        } @else {
            <button
                type="button"
                class="watchlist-toggle watchlist-toggle--labeled"
                [class.watchlist-toggle--active]="isInWatchlist"
                [disabled]="pending"
                [attr.aria-label]="
                    isInWatchlist
                        ? title + ' is on your watchlist'
                        : 'Add ' + title + ' to watchlist'
                "
                (click)="toggle($event)"
            >
                <i
                    [class.fa-solid]="isInWatchlist"
                    [class.fa-regular]="!isInWatchlist"
                    class="fa-bookmark"
                    aria-hidden="true"
                ></i>
                <span class="watchlist-toggle__label">{{
                    watchlistLabel
                }}</span>
            </button>
        }
    `,
    styleUrl: './watchlist-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistToggleComponent implements OnChanges {
    @Input({ required: true }) mediaId!: number;
    @Input({ required: true }) mediaType!: Extract<MediaType, 'movie' | 'tv'>;
    @Input({ required: true }) title!: string;
    @Input() variant: 'icon' | 'labeled' = 'icon';

    isInWatchlist = false;
    watchlistLabel = 'Add to Watchlist';
    pending = false;

    private readonly refresh$ = new Subject<void>();

    constructor(
        private readonly cdr: ChangeDetectorRef,
        private readonly destroyRef: DestroyRef,
        private readonly router: Router,
        private readonly snackBar: MatSnackBar,
        private readonly tmdbListService: TmdbListService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        this.refresh$
            .pipe(
                switchMap(() =>
                    this.tmdbListService.getWatchlistState$(
                        this.mediaId,
                        this.mediaType,
                    ),
                ),
                catchError(() => {
                    this.pending = false;
                    this.cdr.markForCheck();
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((inWatchlist) => {
                this.isInWatchlist = inWatchlist;
                this.watchlistLabel = inWatchlist
                    ? 'On Watchlist'
                    : 'Add to Watchlist';
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

    toggle(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.userSessionStore.mode() !== 'user') {
            this.tmdbUserAuthService
                .startLogin$(this.router.url)
                .pipe(
                    take(1),
                    catchError((error) => this.showError(error)),
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
                catchError((error) => {
                    this.pending = false;
                    this.cdr.markForCheck();
                    return this.showError(error);
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.isInWatchlist = newValue;
                this.watchlistLabel = newValue
                    ? 'On Watchlist'
                    : 'Add to Watchlist';
                this.pending = false;
                this.cdr.markForCheck();
            });
    }

    private showError(error: unknown) {
        this.snackBar.open(
            toUserFacingErrorMessage(error, 'Could not update your watchlist.'),
            'Dismiss',
            { duration: 5000, panelClass: 'snackbar-error' },
        );
        return EMPTY;
    }
}
