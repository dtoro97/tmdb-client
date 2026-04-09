import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    EMPTY,
    Observable,
    catchError,
    distinctUntilChanged,
    map,
    switchMap,
    take,
    tap,
} from 'rxjs';

import {
    BadgeComponent,
    EmptyStateComponent,
    HeroSurfaceComponent,
    RepeatPipe,
    SkeletonComponent,
    toUserFacingErrorMessage,
} from '../../../shared';
import {
    UserListConfirmDialogComponent,
    UserListConfirmDialogData,
} from '../user-list-confirm-dialog/user-list-confirm-dialog.component';
import { UserListDetailItemCardComponent } from '../user-list-detail-item-card/user-list-detail-item-card.component';
import {
    UserListEditDialogComponent,
    UserListEditDialogData,
} from '../user-list-edit-dialog/user-list-edit-dialog.component';
import {
    UserListDetailHeader,
    UserListDetailItem,
} from '../user-list-detail.models';
import { UserListDetailStore } from '../user-list-detail-store.service';

const LIST_NAME_MAX_LENGTH = 100;
const LIST_DESCRIPTION_MAX_LENGTH = 280;

@Component({
    selector: 'app-user-list-detail-page',
    imports: [
        AsyncPipe,
        RouterLink,
        MatButtonModule,
        BadgeComponent,
        EmptyStateComponent,
        HeroSurfaceComponent,
        RepeatPipe,
        SkeletonComponent,
        UserListDetailItemCardComponent,
    ],
    templateUrl: './user-list-detail-page.component.html',
    styleUrl: './user-list-detail-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [UserListDetailStore],
})
export class UserListDetailPageComponent {
    readonly vm$ = this.store.vm$;
    readonly backLink = '/me/lists';
    readonly initialSkeletonCount = 6;
    readonly loadingMoreSkeletonCount = 4;

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly snackBar: MatSnackBar,
        private readonly store: UserListDetailStore,
        private readonly titleService: Title,
    ) {
        this.route.paramMap
            .pipe(
                map((params) => Number(params.get('listId'))),
                distinctUntilChanged(),
                switchMap((listId) =>
                    this.store.loadList$(listId).pipe(catchError(() => EMPTY)),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();

        this.vm$
            .pipe(
                tap((vm) => {
                    if (vm.header) {
                        this.titleService.setTitle(
                            `${vm.header.name} | Your TMDb List`,
                        );
                        return;
                    }

                    this.titleService.setTitle('Your TMDb List');
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onShowMore(): void {
        this.store
            .loadMore$()
            .pipe(
                take(1),
                catchError((error) =>
                    this.showError(error, 'Could not load more list items.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onEditDetails(header: UserListDetailHeader): void {
        this.dialog
            .open<UserListEditDialogComponent, UserListEditDialogData>(
                UserListEditDialogComponent,
                {
                    autoFocus: false,
                    data: {
                        name: header.name,
                        description: header.description,
                        maxNameLength: LIST_NAME_MAX_LENGTH,
                        maxDescriptionLength: LIST_DESCRIPTION_MAX_LENGTH,
                    },
                    maxWidth: '34rem',
                    panelClass: 'media-list-dialog-panel',
                    width: '100%',
                },
            )
            .afterClosed()
            .pipe(
                take(1),
                switchMap((result) => {
                    if (!result) {
                        return EMPTY;
                    }

                    if (
                        result.name === header.name &&
                        result.description === (header.description ?? '')
                    ) {
                        return EMPTY;
                    }

                    return this.store.updateList$(result).pipe(
                        tap(() => {
                            this.showSuccess('List details updated.');
                        }),
                    );
                }),
                catchError((error) =>
                    this.showError(error, 'Could not update this list.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onClearList(): void {
        this.confirmAction$({
            title: 'Clear this list?',
            message:
                'Every title will be removed, but the list itself will stay in place so you can reuse it.',
            confirmLabel: 'Clear list',
        })
            .pipe(
                switchMap((confirmed) =>
                    confirmed ? this.store.clearList$() : EMPTY,
                ),
                tap(() => {
                    this.showSuccess('List cleared.');
                }),
                catchError((error) =>
                    this.showError(error, 'Could not clear this list.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onDeleteList(): void {
        this.confirmAction$({
            title: 'Delete this list?',
            message:
                'This permanently removes the list and every item saved to it from your TMDb account.',
            confirmLabel: 'Delete list',
        })
            .pipe(
                switchMap((confirmed) =>
                    confirmed ? this.store.deleteList$() : EMPTY,
                ),
                tap(() => {
                    void this.router.navigateByUrl(this.backLink);
                    this.showSuccess('List deleted.');
                }),
                catchError((error) =>
                    this.showError(error, 'Could not delete this list.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onRemoveItem(item: UserListDetailItem): void {
        this.confirmAction$({
            title: `Remove ${item.title}?`,
            message:
                'The title will be removed from this list, but it will still be available everywhere else in the app.',
            confirmLabel: 'Remove item',
        })
            .pipe(
                switchMap((confirmed) =>
                    confirmed ? this.store.removeItem$(item) : EMPTY,
                ),
                tap(() => {
                    this.showSuccess('Item removed from the list.');
                }),
                catchError((error) =>
                    this.showError(error, 'Could not remove this item.'),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private confirmAction$(
        data: UserListConfirmDialogData,
    ): Observable<boolean> {
        return this.dialog
            .open<
                UserListConfirmDialogComponent,
                UserListConfirmDialogData,
                true | undefined
            >(UserListConfirmDialogComponent, {
                autoFocus: false,
                data,
                maxWidth: '30rem',
                width: '100%',
            })
            .afterClosed()
            .pipe(
                take(1),
                map((result) => result === true),
            );
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 4000,
            panelClass: 'snackbar-success',
        });
    }

    private showError(error: unknown, fallback: string) {
        this.snackBar.open(
            toUserFacingErrorMessage(error, fallback),
            'Dismiss',
            {
                duration: 5000,
                panelClass: 'snackbar-error',
            },
        );

        return EMPTY;
    }
}
