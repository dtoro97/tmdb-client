import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { DiscoverRestControllerService } from '../../api';
import {
    API_JSON_OPTIONS,
    OPENING_SOON_MOVIE_DAYS_AHEAD,
    THEATRICAL_MOVIE_RELEASE_TYPE,
} from '../../constants';
import {
    LocaleStoreService,
    MediaListItem,
    serializeNumberListParam,
    toISODate,
    toMediaListItem,
    toTmdbDiscoverSort,
} from '../../shared';
import {
    DiscoverDateWindow,
    DiscoverPageDefinition,
    DiscoverQueryState,
    DiscoverRuntimePreset,
} from './discover-page-definitions';

interface DateRange {
    readonly from?: string;
    readonly to?: string;
}

interface RuntimeRange {
    readonly min?: number;
    readonly max?: number;
}

export interface DiscoverListResult {
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
    readonly items: readonly MediaListItem[];
}

@Injectable({ providedIn: 'root' })
export class DiscoverQueryService {
    constructor(
        private readonly discoverService: DiscoverRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {}

    list$(
        definition: DiscoverPageDefinition,
        query: DiscoverQueryState,
        page: number,
    ): Observable<DiscoverListResult> {
        return query.mediaType === 'movie'
            ? this.movieList$(definition, query, page)
            : this.tvList$(definition, query, page);
    }

    private movieList$(
        definition: DiscoverPageDefinition,
        query: DiscoverQueryState,
        page: number,
    ): Observable<DiscoverListResult> {
        const language = this.localeStore.language();
        const movieReleaseType = this.resolveMovieReleaseType(definition, query);
        const releaseRegion = definition.dateWindow || movieReleaseType ? query.watchRegion : undefined;
        const dateWindow = this.resolveDateWindow(definition.dateWindow);
        const yearDates = this.resolveYearRange(query.yearFrom, query.yearTo);
        const primaryReleaseDates = definition.dateWindow ? {} : yearDates;
        const releaseDates = definition.dateWindow ? dateWindow : {};
        const runtime = this.resolveRuntime(query.runtimePreset);
        const providerFilter = serializeNumberListParam(query.providerIds) ?? undefined;
        const companyFilter = serializeNumberListParam(query.companyIds, '|') ?? undefined;

        return this.discoverService
            .discoverMovie(
                query.certification ?? undefined,
                undefined,
                undefined,
                query.certification ? query.watchRegion : undefined,
                false,
                undefined,
                language,
                page,
                undefined,
                primaryReleaseDates.from,
                primaryReleaseDates.to,
                releaseRegion,
                releaseDates.from,
                releaseDates.to,
                toTmdbDiscoverSort(
                    'movie',
                    query.sortKey,
                    query.sortDirection,
                ),
                query.voteAverageGte ?? undefined,
                undefined,
                query.voteCountGte ?? undefined,
                undefined,
                providerFilter ? query.watchRegion : undefined,
                undefined,
                companyFilter,
                undefined,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                undefined,
                query.originalLanguage ?? undefined,
                undefined,
                movieReleaseType,
                runtime.min,
                runtime.max,
                undefined,
                providerFilter,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                map((response) => ({
                    page: response.page ?? page,
                    totalPages: response.total_pages ?? 0,
                    totalResults: response.total_results ?? 0,
                    items: (response.results ?? []).map((item) =>
                        toMediaListItem(item, 'movie', 'full'),
                    ),
                })),
            );
    }

    private tvList$(
        definition: DiscoverPageDefinition,
        query: DiscoverQueryState,
        page: number,
    ): Observable<DiscoverListResult> {
        const language = this.localeStore.language();
        const dateWindow = this.resolveDateWindow(definition.dateWindow);
        const yearDates = this.resolveYearRange(query.yearFrom, query.yearTo);
        const runtime = this.resolveRuntime(query.runtimePreset);
        const providerFilter = serializeNumberListParam(query.providerIds) ?? undefined;
        const companyFilter = serializeNumberListParam(query.companyIds, '|') ?? undefined;

        return this.discoverService
            .discoverTv(
                definition.dateWindow ? dateWindow.from : undefined,
                definition.dateWindow ? dateWindow.to : undefined,
                undefined,
                definition.dateWindow ? undefined : yearDates.from,
                definition.dateWindow ? undefined : yearDates.to,
                false,
                undefined,
                language,
                page,
                undefined,
                toTmdbDiscoverSort(
                    'tv',
                    query.sortKey,
                    query.sortDirection,
                ),
                undefined,
                query.voteAverageGte ?? undefined,
                undefined,
                query.voteCountGte ?? undefined,
                undefined,
                providerFilter ? query.watchRegion : undefined,
                companyFilter,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                undefined,
                undefined,
                query.originalLanguage ?? undefined,
                runtime.min,
                runtime.max,
                undefined,
                undefined,
                providerFilter,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                map((response) => ({
                    page: response.page ?? page,
                    totalPages: response.total_pages ?? 0,
                    totalResults: response.total_results ?? 0,
                    items: (response.results ?? []).map((item) =>
                        toMediaListItem(item, 'tv', 'full'),
                    ),
                })),
            );
    }

    private resolveDateWindow(window: DiscoverDateWindow | undefined): DateRange {
        if (!window) {
            return {};
        }

        const today = new Date();

        if (window === 'airing-today') {
            const date = toISODate(today);
            return { from: date, to: date };
        }

        if (window === 'now-playing') {
            const start = new Date(today);
            const end = new Date(today);
            start.setDate(today.getDate() - 15);
            end.setDate(today.getDate() + 15);

            return {
                from: toISODate(start),
                to: toISODate(end),
            };
        }

        const end = new Date(today);
        end.setDate(
            today.getDate() + (window === 'on-the-air' ? 7 : OPENING_SOON_MOVIE_DAYS_AHEAD),
        );

        return {
            from: toISODate(today),
            to: toISODate(end),
        };
    }

    private resolveYearRange(
        yearFrom: number | null,
        yearTo: number | null,
    ): DateRange {
        return {
            from: yearFrom ? `${yearFrom}-01-01` : undefined,
            to: yearTo ? `${yearTo}-12-31` : undefined,
        };
    }

    private resolveRuntime(preset: DiscoverRuntimePreset): RuntimeRange {
        if (preset === 'short') {
            return { max: 30 };
        }

        if (preset === 'standard') {
            return { min: 30, max: 120 };
        }

        if (preset === 'long') {
            return { min: 120 };
        }

        return {};
    }

    private resolveMovieReleaseType(definition: DiscoverPageDefinition, query: DiscoverQueryState): number | undefined {
        if (definition.movieReleaseTypeFilter === 'theatrical') {
            return THEATRICAL_MOVIE_RELEASE_TYPE;
        }

        return query.releaseType ?? undefined;
    }

}
