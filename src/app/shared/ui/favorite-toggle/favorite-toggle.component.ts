import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    effect,
    input,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, catchError, take } from 'rxjs';

import type { MediaType } from '../../types';
import { SnackbarService, SnackbarType } from '../../services/snackbar.service';
import { TmdbListService } from '../../services/tmdb-list.service';
import { UserSessionStoreService } from '../../services/user-session-store.service';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { TmdbSigninDialogService } from '../tmdb-signin-dialog/tmdb-signin-dialog.service';

interface ToggleTarget {
    readonly mediaId: number;
    readonly mediaType: MediaType;
}

@Component({
    selector: 'app-favorite-toggle',
    imports: [IconButtonComponent],
    templateUrl: './favorite-toggle.component.html',
    styleUrl: './favorite-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteToggleComponent {
    readonly mediaId = input.required<number>();
    readonly mediaType = input.required<MediaType>();
    readonly title = input.required<string>();

    readonly isFavorite = signal(false);
    readonly favoriteTitle = computed(() => (this.isFavorite() ? 'Remove from favorites' : 'Add to favorites'));
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
                this.isFavorite.set(false);
                this.pending.set(false);
                return;
            }

            this.isFavorite.set(false);
            this.pending.set(true);

            const subscription = this.tmdbListService
                .getFavoriteState$(target.mediaId, target.mediaType)
                .pipe(
                    take(1),
                    catchError(() => {
                        this.pending.set(false);
                        return EMPTY;
                    }),
                )
                .subscribe((isFavorite) => {
                    this.isFavorite.set(isFavorite);
                    this.pending.set(false);
                });

            onCleanup(() => {
                subscription.unsubscribe();
            });
        });
    }

    toggle(): void {
        const target = this.target();

        if (!target || this.pending()) {
            return;
        }

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

        this.pending.set(true);

        const nextValue = !this.isFavorite();

        this.tmdbListService
            .updateFavorite$(target.mediaId, target.mediaType, nextValue)
            .pipe(
                take(1),
                catchError(() => {
                    this.pending.set(false);
                    return this.showError('Could not update your favorites.');
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.isFavorite.set(nextValue);
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
