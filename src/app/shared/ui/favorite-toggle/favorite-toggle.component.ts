import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    Input,
    OnChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, Subject, catchError, switchMap, take } from 'rxjs';

import type { MediaType } from '../../types';
import { SnackbarService, SnackbarType } from '../../services/snackbar.service';
import { TmdbListService } from '../../services/tmdb-list.service';
import { UserSessionStoreService } from '../../services/user-session-store.service';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { TmdbSigninDialogService } from '../tmdb-signin-dialog/tmdb-signin-dialog.service';

@Component({
    selector: 'app-favorite-toggle',
    imports: [IconButtonComponent],
    templateUrl: './favorite-toggle.component.html',
    styleUrl: './favorite-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteToggleComponent implements OnChanges {
    @Input({ required: true }) mediaId!: number;
    @Input({ required: true }) mediaType!: MediaType;
    @Input({ required: true }) title!: string;

    isFavorite = false;
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
                switchMap(() =>
                    this.tmdbListService.getFavoriteState$(
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
            .subscribe((isFavorite) => {
                this.isFavorite = isFavorite;
                this.pending = false;
                this.cdr.markForCheck();
            });
    }

    ngOnChanges(): void {
        if (!this.mediaId || !this.mediaType) {
            return;
        }

        this.refresh$.next();
    }

    toggle(): void {
        if (!this.userSessionStore.isAuthenticated()) {
            this.tmdbSigninDialog
                .open$()
                .pipe(
                    take(1),
                    catchError(() => this.showError('Could not update your favorites.')),
                    takeUntilDestroyed(this.destroyRef),
                )
                .subscribe();
            return;
        }

        this.pending = true;
        this.cdr.markForCheck();

        const nextValue = !this.isFavorite;

        this.tmdbListService
            .updateFavorite$(this.mediaId, this.mediaType, nextValue)
            .pipe(
                take(1),
                catchError(() => {
                    this.pending = false;
                    this.cdr.markForCheck();
                    return this.showError('Could not update your favorites.');
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.isFavorite = nextValue;
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
