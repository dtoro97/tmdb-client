import { ChangeDetectionStrategy, Component, DestroyRef, Inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

import { EMPTY, catchError, finalize, take } from 'rxjs';

import { TmdbUserAuthService } from '../../services/tmdb-user-auth.service';

export interface TmdbSigninDialogData {
    readonly title?: string;
    readonly description?: string;
    readonly actionLabel?: string;
    readonly returnUrl?: string;
}

export type TmdbSigninDialogResult = 'started' | undefined;

@Component({
    selector: 'app-tmdb-signin-dialog',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './tmdb-signin-dialog.component.html',
    styleUrl: './tmdb-signin-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TmdbSigninDialogComponent {
    readonly pending = signal(false);
    readonly title: string;
    readonly description: string;
    readonly actionLabel: string;

    constructor(
        private readonly destroyRef: DestroyRef,
        @Inject(MAT_DIALOG_DATA)
        private readonly data: TmdbSigninDialogData | null,
        private readonly dialogRef: MatDialogRef<
            TmdbSigninDialogComponent,
            TmdbSigninDialogResult
        >,
        private readonly router: Router,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
    ) {
        this.title = data?.title ?? 'Sign in';
        this.description =
            data?.description ??
            'Track what you love. Create lists, save favorites, and build your watchlist.';
        this.actionLabel = data?.actionLabel ?? 'Sign in';
    }

    requestLogin(): void {
        if (this.pending()) {
            return;
        }

        this.pending.set(true);

        this.tmdbUserAuthService
            .startLogin$(this.data?.returnUrl ?? this.router.url)
            .pipe(
                take(1),
                catchError(() => {
                    return EMPTY;
                }),
                finalize(() => this.pending.set(false)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.dialogRef.close('started'));
    }

    cancel(): void {
        this.dialogRef.close(undefined);
    }
}
