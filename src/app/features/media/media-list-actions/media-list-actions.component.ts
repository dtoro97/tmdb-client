import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EMPTY, catchError, of, switchMap, take, tap } from 'rxjs';

import {
    MediaUserListSummary,
    MediaType,
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
import { MediaSigninDialogComponent } from '../media-signin-dialog/media-signin-dialog.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-media-list-actions',
    imports: [AsyncPipe, MatTooltipModule],
    templateUrl: './media-list-actions.component.html',
    styleUrl: './media-list-actions.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListActionsComponent {
    @Input({ required: true }) title = '';
    @Input({ required: true }) mediaType!: Extract<MediaType, 'movie' | 'tv'>;

    readonly vm$ = this.mediaDetailActionsStore.listActionsVm$;

    constructor(
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
                : this.openSigninDialog();

        action$
            .pipe(
                take(1),
                catchError((error) =>
                    this.showError(error, 'Could not update your watchlist.'),
                ),
            )
            .subscribe();
    }

    toggleFavorite(): void {
        const action$ =
            this.userSessionStore.mode() === 'user'
                ? this.mediaDetailActionsStore.toggleFavorite$()
                : this.openSigninDialog();

        action$
            .pipe(
                take(1),
                catchError((error) =>
                    this.showError(error, 'Could not update your favorites.'),
                ),
            )
            .subscribe();
    }

    openCustomListsDialog(): void {
        if (
            this.userSessionStore.mode() !== 'user' ||
            !this.userSessionStore.v4AccessToken()
        ) {
            this.openSigninDialog()
                .pipe(
                    take(1),
                    catchError((error) =>
                        this.showError(error, 'Could not update your list.'),
                    ),
                )
                .subscribe();
            return;
        }

        this.tmdbListService
            .getUserLists$()
            .pipe(
                take(1),
                catchError(() => of([] as MediaUserListSummary[])),
                switchMap((lists) => this.openListsDialog(lists)),
                tap(() => this.showSuccess('Media added to your list.')),
                catchError((error) =>
                    this.showError(error, 'Could not update your list.'),
                ),
            )
            .subscribe();
    }

    private openListsDialog(customLists: MediaUserListSummary[]) {
        return this.dialog
            .open<
                MediaListDialogComponent,
                MediaListDialogData,
                MediaListDialogResult
            >(MediaListDialogComponent, {
                data: { title: this.title, customLists },
                autoFocus: false,
                maxWidth: '32rem',
                panelClass: 'media-list-dialog-panel',
                width: '100%',
            })
            .afterClosed()
            .pipe(
                take(1),
                switchMap((result) => this.handleListsDialogResult(result)),
            );
    }

    private openSigninDialog() {
        return this.dialog
            .open<MediaSigninDialogComponent, undefined, boolean>(
                MediaSigninDialogComponent,
                {
                autoFocus: false,
                maxWidth: '32rem',
                panelClass: 'media-list-dialog-panel',
                width: '100%',
                },
            )
            .afterClosed()
            .pipe(
                take(1),
                switchMap((shouldLogin) =>
                    shouldLogin
                        ? this.tmdbUserAuthService.startLogin$(this.router.url)
                        : EMPTY,
                ),
            );
    }

    private handleListsDialogResult(result: MediaListDialogResult | undefined) {
        if (result === undefined) {
            return EMPTY;
        }

        if (result.kind === 'create-list') {
            return this.mediaDetailActionsStore.createListAndAdd$(
                result.name,
                result.description,
            );
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

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 4000,
            panelClass: 'snackbar-success',
        });
    }
}
