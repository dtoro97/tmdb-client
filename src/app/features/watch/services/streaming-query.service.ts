import { Injectable } from '@angular/core';

import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { DiscoverRestControllerService, MovieListItem, TvSeriesListItem } from '../../../api';
import { API_JSON_OPTIONS } from '../../../constants';
import {
    LocaleStoreService,
    MediaType,
    isDefined,
    serializeNumberListParam,
    SortDirection,
    toISODate,
    toMediaListItem,
    toTmdbDiscoverSort,
} from '../../../shared';
import {
    StreamingBaseQuery,
    StreamingDatePreset,
    StreamingListResult,
    StreamingPreviewItem,
    StreamingSortKey,
} from '../models/streaming-browse.models';

interface DateWindow {
    readonly from?: string;
    readonly to?: string;
}

@Injectable({ providedIn: 'root' })
export class StreamingQueryService {
    constructor(
        private readonly discoverService: DiscoverRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {}

    preview$(query: StreamingBaseQuery): Observable<StreamingPreviewItem[]> {
        const requests = query.mediaTypes.map((mediaType) => this.discoverByMediaType$(mediaType, query));

        return forkJoin(requests).pipe(
            map((groups) =>
                this.interleavePreviewGroups(groups)
                    .filter((item) => !!item.imagePath)
                    .slice(0, 3),
            ),
            catchError(() => of([] as StreamingPreviewItem[])),
        );
    }

    private discoverByMediaType$(mediaType: MediaType, query: StreamingBaseQuery): Observable<StreamingPreviewItem[]> {
        return mediaType === 'movie' ? this.discoverMovies$(query) : this.discoverTv$(query);
    }

    private interleavePreviewGroups(
        groups: readonly StreamingPreviewItem[][],
    ): StreamingPreviewItem[] {
        const longestGroupLength = Math.max(
            0,
            ...groups.map((group) => group.length),
        );

        return Array.from({ length: longestGroupLength }).flatMap((_, index) =>
            groups
                .map((group) => group[index])
                .filter(isDefined),
        );
    }

    list$(
        query: StreamingBaseQuery,
        mediaType: MediaType,
        sortKey: StreamingSortKey,
        direction: SortDirection,
        page: number,
    ): Observable<StreamingListResult> {
        return mediaType === 'movie'
            ? this.movieList$(query, sortKey, direction, page)
            : this.tvList$(query, sortKey, direction, page);
    }

    private discoverMovies$(query: StreamingBaseQuery): Observable<StreamingPreviewItem[]> {
        const dateWindow = this.resolveDateWindow(query.datePreset);
        const region = this.localeStore.region() || 'US';
        const releaseRegion = this.resolveMovieReleaseRegion(
            query,
            dateWindow,
            region,
        );
        const watchRegion = this.resolveWatchRegion(query, region);

        return this.discoverService
            .discoverMovie(
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                dateWindow.from,
                dateWindow.to,
                releaseRegion,
                undefined,
                undefined,
                toTmdbDiscoverSort('movie', query.sortBy, 'desc'),
                query.voteAverageMin,
                undefined,
                query.voteCountMin,
                query.voteCountMax,
                watchRegion,
                undefined,
                undefined,
                undefined,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                query.originCountry,
                query.originalLanguage,
                undefined,
                query.releaseType ? Number(query.releaseType) : undefined,
                undefined,
                query.runtimeMax,
                query.monetization,
                query.providerId ? `${query.providerId}` : undefined,
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
                map((response) =>
                    (response.results ?? [])
                        .map((item) => this.toMoviePreview(item))
                        .filter(isDefined),
                ),
                catchError(() => of([] as StreamingPreviewItem[])),
            );
    }

    private discoverTv$(query: StreamingBaseQuery): Observable<StreamingPreviewItem[]> {
        const dateWindow = this.resolveDateWindow(query.datePreset);
        const region = this.localeStore.region() || 'US';
        const watchRegion = this.resolveWatchRegion(query, region);

        return this.discoverService
            .discoverTv(
                dateWindow.from,
                dateWindow.to,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                1,
                undefined,
                toTmdbDiscoverSort('tv', query.sortBy, 'desc'),
                undefined,
                query.voteAverageMin,
                undefined,
                query.voteCountMin,
                query.voteCountMax,
                watchRegion,
                undefined,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                undefined,
                query.originCountry,
                query.originalLanguage,
                undefined,
                query.runtimeMax,
                undefined,
                query.monetization,
                query.providerId ? `${query.providerId}` : undefined,
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
                map((response) =>
                    (response.results ?? [])
                        .map((item) => this.toTvPreview(item))
                        .filter(isDefined),
                ),
                catchError(() => of([] as StreamingPreviewItem[])),
            );
    }

    private movieList$(
        query: StreamingBaseQuery,
        sortKey: StreamingSortKey,
        direction: SortDirection,
        page: number,
    ): Observable<StreamingListResult> {
        const dateWindow = this.resolveDateWindow(query.datePreset);
        const region = this.localeStore.region() || 'US';
        const releaseRegion = this.resolveMovieReleaseRegion(
            query,
            dateWindow,
            region,
        );
        const watchRegion = this.resolveWatchRegion(query, region);

        return this.discoverService
            .discoverMovie(
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                page,
                undefined,
                dateWindow.from,
                dateWindow.to,
                releaseRegion,
                undefined,
                undefined,
                toTmdbDiscoverSort('movie', sortKey, direction),
                query.voteAverageMin,
                undefined,
                query.voteCountMin,
                query.voteCountMax,
                watchRegion,
                undefined,
                undefined,
                undefined,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                query.originCountry,
                query.originalLanguage,
                undefined,
                query.releaseType ? Number(query.releaseType) : undefined,
                undefined,
                query.runtimeMax,
                query.monetization,
                query.providerId ? `${query.providerId}` : undefined,
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
                    items: (response.results ?? []).map((item) => toMediaListItem(item, 'movie')),
                    page: response.page ?? page,
                    totalPages: response.total_pages ?? 0,
                    totalResults: response.total_results ?? 0,
                })),
            );
    }

    private tvList$(
        query: StreamingBaseQuery,
        sortKey: StreamingSortKey,
        direction: SortDirection,
        page: number,
    ): Observable<StreamingListResult> {
        const dateWindow = this.resolveDateWindow(query.datePreset);
        const region = this.localeStore.region() || 'US';
        const watchRegion = this.resolveWatchRegion(query, region);

        return this.discoverService
            .discoverTv(
                dateWindow.from,
                dateWindow.to,
                undefined,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                page,
                undefined,
                toTmdbDiscoverSort('tv', sortKey, direction),
                undefined,
                query.voteAverageMin,
                undefined,
                query.voteCountMin,
                query.voteCountMax,
                watchRegion,
                undefined,
                serializeNumberListParam(query.genreIds) ?? undefined,
                serializeNumberListParam(query.keywordIds) ?? undefined,
                undefined,
                query.originCountry,
                query.originalLanguage,
                undefined,
                query.runtimeMax,
                undefined,
                query.monetization,
                query.providerId ? `${query.providerId}` : undefined,
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
                    items: (response.results ?? []).map((item) => toMediaListItem(item, 'tv')),
                    page: response.page ?? page,
                    totalPages: response.total_pages ?? 0,
                    totalResults: response.total_results ?? 0,
                })),
            );
    }

    private toMoviePreview(item: MovieListItem): StreamingPreviewItem | null {
        if (!item.id || !item.poster_path) {
            return null;
        }

        return {
            key: `movie-${item.id}`,
            id: item.id,
            mediaType: 'movie',
            title: item.title ?? item.original_title ?? '',
            imagePath: item.poster_path,
            backdropPath: item.backdrop_path ?? null,
        };
    }

    private toTvPreview(item: TvSeriesListItem): StreamingPreviewItem | null {
        if (!item.id || !item.poster_path) {
            return null;
        }

        return {
            key: `tv-${item.id}`,
            id: item.id,
            mediaType: 'tv',
            title: item.name ?? item.original_name ?? '',
            imagePath: item.poster_path,
            backdropPath: item.backdrop_path ?? null,
        };
    }

    private resolveDateWindow(preset?: StreamingDatePreset): DateWindow {
        if (!preset) {
            return {};
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        if (preset === 'today') {
            const today = toISODate(now);
            return {
                from: today,
                to: today,
            };
        }

        if (preset === 'current-season') {
            const seasonStartMonth = Math.floor(month / 3) * 3;
            return {
                from: toISODate(new Date(year, seasonStartMonth, 1)),
                to: toISODate(new Date(year, seasonStartMonth + 3, 0)),
            };
        }

        if (preset === 'current-two-months') {
            return {
                from: toISODate(new Date(year, month, 1)),
                to: toISODate(new Date(year, month + 2, 0)),
            };
        }

        return {
            from: toISODate(new Date(year, month, 1)),
            to: toISODate(new Date(year, month + 1, 0)),
        };
    }

    private resolveMovieReleaseRegion(
        query: StreamingBaseQuery,
        dateWindow: DateWindow,
        region: string,
    ): string | undefined {
        return dateWindow.from || dateWindow.to || query.releaseType
            ? region
            : undefined;
    }

    private resolveWatchRegion(
        query: StreamingBaseQuery,
        region: string,
    ): string | undefined {
        return query.providerId || query.monetization ? region : undefined;
    }

}
