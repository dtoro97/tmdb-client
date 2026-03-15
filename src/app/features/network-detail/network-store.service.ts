import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import {
    catchError,
    EMPTY,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
    tap,
} from 'rxjs';

import {
    AlternativeNameList,
    DiscoverRestControllerService,
    NetworkDetails,
    NetworkImages,
    NetworkRestControllerService,
    TvSeriesListItem,
} from '../../api';
import { loader, MediaListItem } from '../../shared';

export type NetworkSortDirection = 'asc' | 'desc';

export interface NetworkSortOption {
    label: string;
    value: string;
}

const NETWORK_SORT_OPTIONS: NetworkSortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'First Air Date', value: 'first_air_date' },
    { label: 'Name', value: 'name' },
];

const DEFAULT_SORT_FIELD = 'popularity';
const DEFAULT_SORT_DIRECTION: NetworkSortDirection = 'desc';

interface NetworkState {
    network?: NetworkDetails;
    logos: string[];
    alternativeNames: string[];
    shows: MediaListItem[];
    totalResults: number;
    page: number;
    totalPages: number;
    networkId?: number;
    sortField: string;
    sortDirection: NetworkSortDirection;
}

const INITIAL_STATE: NetworkState = {
    logos: [],
    alternativeNames: [],
    shows: [],
    totalResults: 0,
    page: 0,
    totalPages: 0,
    sortField: DEFAULT_SORT_FIELD,
    sortDirection: DEFAULT_SORT_DIRECTION,
};

@Injectable()
export class NetworkStoreService extends ComponentStore<NetworkState> {
    network$ = this.select((state) => state.network);
    shows$ = this.select((state) => state.shows);
    totalResults$ = this.select((state) => state.totalResults);
    sortField$ = this.select((state) => state.sortField);
    sortDirection$ = this.select((state) => state.sortDirection);
    alternativeNames$ = this.select((state) => state.alternativeNames);
    hasMore$ = this.select((state) => state.page < state.totalPages);

    logoPath$ = this.select((state) => {
        if (state.network?.logo_path) {
            return state.network.logo_path;
        }
        return state.logos[0] ?? null;
    });

    readonly sortOptions = NETWORK_SORT_OPTIONS;

    private readonly opts = { httpHeaderAccept: 'application/json' as const };

    constructor(
        private networkRestControllerService: NetworkRestControllerService,
        private discoverRestControllerService: DiscoverRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
        private router: Router,
    ) {
        super(INITIAL_STATE);
    }

    loadNetwork$(networkId: number): Observable<void> {
        const normalizedSortField = DEFAULT_SORT_FIELD;
        const normalizedSortDirection = DEFAULT_SORT_DIRECTION;

        this.patchState({
            ...INITIAL_STATE,
            networkId,
            sortField: normalizedSortField,
            sortDirection: normalizedSortDirection,
        });

        return this.networkRestControllerService
            .networkDetails(networkId, undefined, undefined, this.opts)
            .pipe(
                switchMap((network) =>
                    forkJoin({
                        logos: this.networkRestControllerService
                            .alternativeNamesCopy(
                                networkId,
                                undefined,
                                undefined,
                                this.opts,
                            )
                            .pipe(
                                catchError(() => of({ logos: [] } as NetworkImages)),
                            ),
                        alternativeNames: this.networkRestControllerService
                            .detailsCopy(
                                networkId,
                                undefined,
                                undefined,
                                this.opts,
                            )
                            .pipe(
                                catchError(() =>
                                    of({ results: [] } as AlternativeNameList),
                                ),
                            ),
                        shows: this.fetchShowsPage$(
                            networkId,
                            1,
                            normalizedSortField,
                            normalizedSortDirection,
                        ).pipe(catchError(() => of(null))),
                    }).pipe(
                        tap(({ logos, alternativeNames, shows }) => {
                            const mappedShows =
                                shows?.results?.map((item) =>
                                    this.mapTvToListItem(item),
                                ) ?? [];
                            this.patchState({
                                network,
                                logos: (logos.logos ?? [])
                                    .map((logo) => logo.file_path)
                                    .filter(
                                        (logoPath): logoPath is string =>
                                            Boolean(logoPath),
                                    ),
                                alternativeNames: (
                                    alternativeNames.results ?? []
                                )
                                    .map((item) => item.name)
                                    .filter(
                                        (name): name is string => Boolean(name),
                                    ),
                                shows: mappedShows,
                                totalResults: shows?.total_results ?? 0,
                                page: shows?.page ?? 1,
                                totalPages: shows?.total_pages ?? 1,
                            });
                        }),
                    ),
                ),
                map(() => undefined),
                loader(this.ngxUiLoaderService),
                catchError(() => {
                    this.router.navigate(['not-found']);
                    return EMPTY;
                }),
            );
    }

    loadMore$(): Observable<void> {
        const { networkId, page, totalPages, sortField, sortDirection, shows } =
            this.get();
        if (!networkId || page >= totalPages) {
            return of(undefined);
        }

        return this.fetchShowsPage$(
            networkId,
            page + 1,
            sortField,
            sortDirection,
        ).pipe(
            tap((response) => {
                const mappedShows = (response.results ?? []).map((item) =>
                    this.mapTvToListItem(item),
                );
                this.patchState({
                    shows: [...shows, ...mappedShows],
                    totalResults: response.total_results ?? 0,
                    page: response.page ?? page + 1,
                    totalPages: response.total_pages ?? totalPages,
                });
            }),
            map(() => undefined),
            catchError(() => EMPTY),
        );
    }

    updateSort(sortField: string): Observable<void> {
        const normalizedSortField = this.normalizeSortField(sortField);
        return this.reloadSortedShows$(
            normalizedSortField,
            this.get().sortDirection,
        );
    }

    toggleSortDirection(): Observable<void> {
        const { sortField, sortDirection } = this.get();
        const nextDirection: NetworkSortDirection =
            sortDirection === 'desc' ? 'asc' : 'desc';
        return this.reloadSortedShows$(sortField, nextDirection);
    }

    private fetchShowsPage$(
        networkId: number,
        page: number,
        sortField: string,
        sortDirection: NetworkSortDirection,
    ) {
        const sortBy = `${sortField}.${sortDirection}` as
            | 'first_air_date.asc'
            | 'first_air_date.desc'
            | 'name.asc'
            | 'name.desc'
            | 'original_name.asc'
            | 'original_name.desc'
            | 'popularity.asc'
            | 'popularity.desc'
            | 'vote_average.asc'
            | 'vote_average.desc'
            | 'vote_count.asc'
            | 'vote_count.desc';

        return this.discoverRestControllerService.discoverTv(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            undefined,
            page,
            undefined,
            sortBy,
            undefined,
            undefined,
            undefined,
            1,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            networkId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            this.opts,
        );
    }

    private normalizeSortField(
        sortField: string | null | undefined,
    ): string {
        if (!sortField) return DEFAULT_SORT_FIELD;
        if (NETWORK_SORT_OPTIONS.some((option) => option.value === sortField)) {
            return sortField;
        }
        return DEFAULT_SORT_FIELD;
    }

    private reloadSortedShows$(
        sortField: string,
        sortDirection: NetworkSortDirection,
    ): Observable<void> {
        const { networkId } = this.get();
        if (!networkId) {
            return of(undefined);
        }

        return this.fetchShowsPage$(networkId, 1, sortField, sortDirection).pipe(
            tap((response) => {
                const mappedShows = (response.results ?? []).map((item) =>
                    this.mapTvToListItem(item),
                );
                this.patchState({
                    sortField,
                    sortDirection,
                    shows: mappedShows,
                    totalResults: response.total_results ?? 0,
                    page: response.page ?? 1,
                    totalPages: response.total_pages ?? 1,
                });
            }),
            map(() => undefined),
            loader(this.ngxUiLoaderService),
            catchError(() => EMPTY),
        );
    }

    private mapTvToListItem(item: TvSeriesListItem): MediaListItem {
        return {
            id: item.id!,
            thumb: item.poster_path ?? null,
            title: item.name ?? '',
            overview: item.overview ?? '',
            rating: item.vote_average ?? null,
            date: item.first_air_date ?? '',
            mediaType: 'tv',
            voteCount: item.vote_count ?? 0,
        };
    }
}
