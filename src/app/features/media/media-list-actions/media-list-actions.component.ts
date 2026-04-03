import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY, catchError, of, switchMap, take } from 'rxjs';

import {
    MediaUserListSummary,
    TmdbListService,
    TmdbUserAuthService,
    UserSessionStoreService,
    toUserFacingErrorMessage,
} from '../../../shared';
import { MediaDetailActionsStore } from '../media-detail-actions-store.service';
import {
    MediaListDialogComponent,
    MediaListDialogData,
    MediaListDialogResult,
} from '../media-list-dialog/media-list-dialog.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-media-list-actions',
    imports: [MatButtonModule, MatMenuModule, AsyncPipe],
    templateUrl: './media-list-actions.component.html',
    styleUrl: './media-list-actions.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListActionsComponent {
    @Input({ required: true }) title = '';

    readonly vm$ = this.mediaDetailActionsStore.listActionsVm$;

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly dialog: MatDialog,
        private readonly mediaDetailActionsStore: MediaDetailActionsStore,
        private readonly router: Router,
        private readonly snackBar: MatSnackBar,
        private readonly tmdbListService: TmdbListService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {}

    toggleWatchlist(): void {
        const action$ =
            this.userSessionStore.mode() === 'user'
                ? this.mediaDetailActionsStore.toggleWatchlist$()
                : this.openDialog('sign-in', []);

        action$
            .pipe(
                take(1),
                catchError((error) =>
                    this.showError(error, 'Could not update your watchlist.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    openCustomListsDialog(): void {
        if (this.userSessionStore.mode() !== 'user') {
            this.openDialog('sign-in', [])
                .pipe(
                    take(1),
                    catchError((error) =>
                        this.showError(error, 'Could not update your list.'),
                    ),
                    takeUntilDestroyed(this.destroyRef),
                )
                .subscribe();
            return;
        }

        this.tmdbListService
            .getUserLists$()
            .pipe(
                take(1),
                catchError(() => of([] as MediaUserListSummary[])),
                switchMap((lists) => this.openDialog('lists', lists)),
                catchError((error) =>
                    this.showError(error, 'Could not update your list.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private openDialog(
        mode: MediaListDialogData['mode'],
        customLists: MediaUserListSummary[],
    ) {
        return this.dialog
            .open<
                MediaListDialogComponent,
                MediaListDialogData,
                MediaListDialogResult
            >(MediaListDialogComponent, {
                data: { title: this.title, mode, customLists },
                autoFocus: false,
                maxWidth: '32rem',
                width: '100%',
            })
            .afterClosed()
            .pipe(
                take(1),
                switchMap((result) => this.handleDialogResult(result)),
            );
    }

    private handleDialogResult(result: MediaListDialogResult | undefined) {
        if (result === undefined) {
            return EMPTY;
        }

        if (result === 'login') {
            return this.tmdbUserAuthService.startLogin$(this.router.url);
        }

        return this.mediaDetailActionsStore.addToList$(result.listId);
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
