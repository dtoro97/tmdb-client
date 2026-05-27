import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { AccountService as AccountV4Service, V4AccountListSummary } from '../../api-v4';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import { LoadableItems, TmdbListService, UserSessionStoreService, isDefined } from '../../shared';
import { toLoadedItems, toPageItemRange, updateLoadedItems } from '../../shared/utils';

export interface UserListSummaryItem {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly isPublic: boolean;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
    readonly numberOfItems: number | null;
    readonly averageRating: number | null;
}

interface UserListsState {
    readonly items: LoadableItems<UserListSummaryItem>;
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
}

const INITIAL_PAGE = 1;

const INITIAL_STATE: UserListsState = {
    items: { type: 'idle' },
    page: INITIAL_PAGE,
    totalPages: INITIAL_PAGE,
    totalResults: 0,
};

@Injectable()
export class UserListsStore extends ComponentStore<UserListsState> {
    readonly listsViewModel$ = this.select((state) => {
        const range = toPageItemRange({
            page: state.page,
            pageSize: PAGE_SIZE,
            itemCount: state.items.type === 'loaded' ? state.items.value.length : 0,
            totalResults: state.totalResults,
        });

        return {
            state: state.items,
            page: state.page - 1,
            pageSize: PAGE_SIZE,
            start: range.start,
            end: range.end,
            total: state.totalResults,
        };
    });

    constructor(
        private readonly accountV4Service: AccountV4Service,
        private readonly tmdbListService: TmdbListService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$() {
        return this.loadPage$(0);
    }

    loadPage$(pageIndex: number) {
        const previousState = this.get();
        const page = pageIndex + 1;

        this.patchState({
            items: { type: 'loading' },
            page,
        });

        return this.fetchListsPage$(page).pipe(
            tap((result) => {
                this.patchState({
                    items: toLoadedItems(result.items),
                    page: result.page,
                    totalPages: result.totalPages,
                    totalResults: result.totalResults,
                });
            }),
            catchError((error: unknown) => {
                this.setState(previousState);
                return throwError(() => error);
            }),
        );
    }

    updateList$(
        listId: number,
        request: {
            readonly name: string;
            readonly description: string;
            readonly isPublic: boolean;
        },
    ) {
        return this.tmdbListService
            .updateList$(listId, {
                name: request.name,
                description: request.description,
                public: request.isPublic,
            })
            .pipe(
                tap(() => {
                    this.patchState((state) => ({
                        items: updateLoadedItems(state.items, (items) =>
                            items.map((item) =>
                                item.id === listId
                                    ? {
                                          ...item,
                                          name: request.name,
                                          description: request.description || null,
                                          isPublic: request.isPublic,
                                      }
                                    : item,
                            ),
                        ),
                    }));
                }),
            );
    }

    deleteList$(listId: number) {
        return this.tmdbListService.deleteList$(listId).pipe(
            switchMap(() => {
                const state = this.get();
                const totalResults = Math.max(0, state.totalResults - 1);
                const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
                const page = Math.min(state.page, totalPages);
                const nextItems =
                    state.items.type === 'loaded'
                        ? state.items.value.filter((item) => item.id !== listId)
                        : null;

                this.patchState({
                    items: nextItems ? toLoadedItems(nextItems) : state.items,
                    page,
                    totalPages,
                    totalResults,
                });

                if (totalResults > 0 && nextItems && (page !== state.page || nextItems.length === 0)) {
                    return this.loadPage$(page - 1);
                }

                return of(undefined);
            }),
        );
    }

    private fetchListsPage$(page: number) {
        const { v4AccountId } = this.userSessionStore.requireV4AccountAccess();

        return this.accountV4Service
            .accountV4Lists(v4AccountId, page, 'body', false, API_JSON_OPTIONS)
            .pipe(
                map((result) => ({
                    items: (result.results ?? [])
                        .map((item) => this.toUserListSummaryItem(item))
                        .filter(isDefined),
                    page: result.page ?? INITIAL_PAGE,
                    totalPages: result.total_pages ?? INITIAL_PAGE,
                    totalResults: result.total_results ?? 0,
                })),
            );
    }

    private toUserListSummaryItem(item: V4AccountListSummary): UserListSummaryItem | null {
        const name = item.name?.trim();

        if (!item.id || !name) {
            return null;
        }

        return {
            id: item.id,
            name,
            description: item.description?.trim() || null,
            isPublic: item.public === V4AccountListSummary.PublicEnum.NUMBER_1,
            createdAt: item.created_at ?? null,
            updatedAt: item.updated_at ?? null,
            numberOfItems: item.number_of_items ?? null,
            averageRating: item.average_rating ?? null,
        };
    }
}
