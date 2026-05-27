import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { EMPTY, Observable, catchError, switchMap, take } from 'rxjs';

import {
    BrowseToolbarComponent,
    CardComponent,
    CardItem,
    ConfirmationDialogService,
    EmptyStateComponent,
    IconButtonComponent,
    MediaType,
    PageScrollService,
    PillToggleComponent,
    RepeatPipe,
    SelectOption,
    SkeletonComponent,
    SnackbarComponent,
    SnackbarService,
    SnackbarType,
    SortButtonComponent,
    SubPageHeaderComponent,
    TmdbUserAccountService,
} from '../../../shared';
import { USER_ACCOUNT_SORT_OPTIONS } from '../user-list-sort-options';
import { UserFavouritesStore } from '../user-favourites-store.service';

@Component({
    selector: 'app-user-favourites-page',
    imports: [
        AsyncPipe,
        MatPaginatorModule,
        BrowseToolbarComponent,
        CardComponent,
        EmptyStateComponent,
        IconButtonComponent,
        PillToggleComponent,
        RepeatPipe,
        SkeletonComponent,
        SortButtonComponent,
        SubPageHeaderComponent,
    ],
    templateUrl: './user-favourites-page.component.html',
    styleUrl: './user-favourites-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [UserFavouritesStore],
})
export class UserFavouritesPageComponent {
    readonly mediaTypeOptions: SelectOption<MediaType>[] = [
        { label: 'Movies', value: 'movie' },
        { label: 'TV series', value: 'tv' },
    ];

    readonly posterImageParams = 'w342';
    readonly skeletonCount = 20;
    readonly sortOptions = USER_ACCOUNT_SORT_OPTIONS;
    readonly vm$ = this.store.favouritesPageViewModel$;

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly confirmationDialog: ConfirmationDialogService,
        private readonly pageScroll: PageScrollService,
        private readonly snackbar: SnackbarService,
        private readonly store: UserFavouritesStore,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
    ) {
        this.tmdbUserAccountService
            .ensureAccountIdentity$()
            .pipe(
                switchMap(() => this.store.loadPage$(0)),
                catchError(() => this.showError('Could not load your favourites.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onSortChange(value: unknown): void {
        this.store
            .setSortField$(value)
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your favourites.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onSortDirectionToggle(): void {
        this.store
            .toggleSortDirection$()
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your favourites.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onRemoveFromFavourites(item: CardItem): void {
        this.confirmationDialog
            .confirm$({
                title: `Remove ${item.title} from favourites?`,
                message: 'This removes the title from your favourites only.',
                confirmLabel: 'Remove favourite',
                tone: 'danger',
            })
            .pipe(
                switchMap((confirmed) => (confirmed ? this.store.removeFromFavourites$(item) : EMPTY)),
                take(1),
                catchError(() => this.showError('Could not update your favourites.')),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    onMediaTypeSelected(value: MediaType): void {
        this.store
            .setMediaType$(value)
            .pipe(
                take(1),
                catchError(() => this.showError('Could not load your favourites.')),
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
                catchError(() => this.showError('Could not load your favourites.')),
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
