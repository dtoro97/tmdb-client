import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

import { EMPTY, Observable, catchError, switchMap, take } from 'rxjs';

import {
    BrowseToolbarComponent,
    ConfirmationDialogService,
    EmptyStateComponent,
    IconButtonComponent,
    MediaListItem,
    MediaRatingDialogComponent,
    MediaRatingDialogResult,
    PageScrollService,
    ToggleGroupComponent,
    RepeatPipe,
    SelectOption,
    SnackbarComponent,
    SnackbarService,
    SnackbarType,
    SortButtonComponent,
    SubPageHeaderComponent,
    TmdbUserAccountService,
    UserSessionStoreService,
} from '../../../shared';
import { AccountEpisodeItemComponent } from '../account-episode-item/account-episode-item.component';
import { AccountMediaItemComponent } from '../account-media-item/account-media-item.component';
import { USER_ACCOUNT_SORT_OPTIONS } from '../user-list-sort-options';
import { UserRatedEpisodeItem, UserRatingContentType, UserRatingsStore } from '../user-ratings-store.service';

@Component({
    selector: 'app-user-ratings-page',
    imports: [
        AsyncPipe,
        MatPaginatorModule,
        AccountEpisodeItemComponent,
        AccountMediaItemComponent,
        BrowseToolbarComponent,
        EmptyStateComponent,
        IconButtonComponent,
        ToggleGroupComponent,
        RepeatPipe,
        SortButtonComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './user-ratings-page.component.html',
    styleUrl: './user-ratings-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [UserRatingsStore],
})
export class UserRatingsPageComponent {
    readonly contentTypeOptions: SelectOption<UserRatingContentType>[] = [
        { label: 'Movies', value: 'movie' },
        { label: 'TV series', value: 'tv' },
        { label: 'Episodes', value: 'episode' },
    ];

    readonly episodeSkeletonCount = 8;
    readonly skeletonCount = 8;
    readonly sortOptions = USER_ACCOUNT_SORT_OPTIONS;
    readonly vm$ = this.store.ratingsPageViewModel$;

    constructor(
        private readonly confirmationDialog: ConfirmationDialogService,
        private readonly destroyRef: DestroyRef,
        private readonly dialog: MatDialog,
        private readonly pageScroll: PageScrollService,
        private readonly snackbar: SnackbarService,
        private readonly store: UserRatingsStore,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        this.tmdbUserAccountService
            .ensureAccountIdentity$()
            .pipe(
                switchMap(() => this.store.loadPage$(0)),
                catchError(() => this.showError('Could not load your ratings.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onSortChange(value: unknown): void {
        this.store
            .setSortField$(value)
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your ratings.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onSortDirectionToggle(): void {
        this.store
            .toggleSortDirection$()
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your ratings.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onEditMediaRating(item: MediaListItem): void {
        this.openRatingDialog$(
            item.title,
            item.rating,
            (value) => this.store.updateMediaRating$(item, value),
            () => this.store.removeMediaRating$(item),
        )
            .pipe(
                take(1),
                catchError(() => this.showError('Could not update your rating.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onRemoveMediaRating(item: MediaListItem): void {
        this.confirmRemoveRating$(item.title)
            .pipe(
                switchMap((confirmed) => (confirmed ? this.store.removeMediaRating$(item) : EMPTY)),
                take(1),
                catchError(() => this.showError('Could not remove your rating.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onEditEpisodeRating(item: UserRatedEpisodeItem): void {
        this.openRatingDialog$(
            item.title,
            item.rating,
            (value) => this.store.updateEpisodeRating$(item, value),
            () => this.store.removeEpisodeRating$(item),
        )
            .pipe(
                take(1),
                catchError(() => this.showError('Could not update your rating.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onRemoveEpisodeRating(item: UserRatedEpisodeItem): void {
        this.confirmRemoveRating$(item.title)
            .pipe(
                switchMap((confirmed) => (confirmed ? this.store.removeEpisodeRating$(item) : EMPTY)),
                take(1),
                catchError(() => this.showError('Could not remove your rating.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private openRatingDialog$(
        title: string,
        currentRating: number | null,
        updateRating: (value: number) => Observable<unknown>,
        removeRating: () => Observable<unknown>,
    ): Observable<unknown> {
        return this.dialog
            .open(MediaRatingDialogComponent, {
                data: {
                    title,
                    currentRating,
                    authMode: this.userSessionStore.mode(),
                },
                maxWidth: '36rem',
                width: '100%',
            })
            .afterClosed()
            .pipe(
                take(1),
                switchMap((result: MediaRatingDialogResult | undefined) => {
                    if (result === undefined || result.action === 'login') {
                        return EMPTY;
                    }

                    if (result.action === 'remove') {
                        return this.confirmRemoveRating$(title).pipe(
                            switchMap((confirmed) => (confirmed ? removeRating() : EMPTY)),
                        );
                    }

                    return updateRating(result.value);
                }),
            );
    }

    private confirmRemoveRating$(title: string): Observable<boolean> {
        return this.confirmationDialog.confirm$({
            title: `Remove rating for ${title}?`,
            message: 'This removes your rating from this title.',
            confirmLabel: 'Remove rating',
            tone: 'danger',
        });
    }

    onContentTypeSelected(value: UserRatingContentType): void {
        this.store
            .setContentType$(value)
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your ratings.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onPageChange(event: PageEvent): void {
        this.pageScroll.scrollToTop();

        this.store
            .loadPage$(event.pageIndex)
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your ratings.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    private showError(message: string): Observable<never> {
        this.snackbar.openSnackbar(SnackbarComponent, {
            message,
            type: SnackbarType.Error,
        });

        return EMPTY;
    }
}
