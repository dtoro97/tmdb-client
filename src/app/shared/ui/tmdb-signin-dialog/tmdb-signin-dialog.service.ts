import { Injectable } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Observable, take } from 'rxjs';

import {
    TmdbSigninDialogComponent,
    TmdbSigninDialogData,
    TmdbSigninDialogResult,
} from './tmdb-signin-dialog.component';

@Injectable({ providedIn: 'root' })
export class TmdbSigninDialogService {
    constructor(private readonly dialog: MatDialog) {}

    open$(data: TmdbSigninDialogData = {}): Observable<TmdbSigninDialogResult> {
        return this.dialog
            .open<TmdbSigninDialogComponent, TmdbSigninDialogData, TmdbSigninDialogResult>(
                TmdbSigninDialogComponent,
                {
                    data,
                    autoFocus: false,
                    maxWidth: '32rem',
                    panelClass: 'tmdb-signin-dialog-panel',
                    width: '100%',
                },
            )
            .afterClosed()
            .pipe(take(1));
    }
}
