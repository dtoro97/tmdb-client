import type {
    MediaListItem,
    MediaType,
    SortDirection,
    TmdbDiscoverSortKey,
    TmdbDiscoverSortOption,
    WatchProviderOption,
} from '../../../shared';

export type StreamingDatePreset = 'today' | 'current-month' | 'current-season' | 'current-two-months';
export type StreamingMonetizationType = 'ads' | 'buy' | 'flatrate' | 'free' | 'rent';
export type StreamingSortKey = TmdbDiscoverSortKey;

export interface StreamingBaseQuery {
    readonly mediaTypes: readonly MediaType[];
    readonly providerId?: number;
    readonly providerIds?: readonly number[];
    readonly monetization?: StreamingMonetizationType;
    readonly genreIds?: readonly number[];
    readonly keywordIds?: readonly number[];
    readonly originalLanguage?: string;
    readonly originCountry?: string;
    readonly datePreset?: StreamingDatePreset;
    readonly releaseType?: string;
    readonly runtimeMax?: number;
    readonly voteAverageMin?: number;
    readonly voteCountMin?: number;
    readonly voteCountMax?: number;
    readonly sortBy: StreamingSortKey;
}

export interface StreamingEditorialSection {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly ctaLabel: string;
    readonly baseQuery: StreamingBaseQuery;
}

export interface StreamingProviderSection {
    readonly provider: WatchProviderOption;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly initial: string;
    readonly ctaLabel: string;
    readonly routerLink: readonly unknown[];
}

export interface StreamingHubSection {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly ctaLabel: string;
    readonly routerLink: readonly unknown[];
    readonly baseQuery: StreamingBaseQuery;
    readonly previews: readonly StreamingPreviewItem[];
}

export interface StreamingProviderCard {
    readonly slug: string;
    readonly providerId: number;
    readonly providerName: string;
    readonly providerLogoPath: string | null;
    readonly routerLink: readonly unknown[];
    readonly baseQuery: StreamingBaseQuery;
    readonly preview: StreamingPreviewItem | null;
}

export interface StreamingPreviewItem {
    readonly key: string;
    readonly id: number;
    readonly mediaType: MediaType;
    readonly title: string;
    readonly imagePath: string;
    readonly backdropPath: string | null;
}

export interface StreamingListResult {
    readonly items: readonly MediaListItem[];
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
}

export type StreamingSortOption = TmdbDiscoverSortOption;

export interface StreamingSortState {
    readonly key: StreamingSortKey;
    readonly direction: SortDirection;
}

export interface StreamingListRouteData {
    readonly streamingListKind?: 'editorial' | 'provider';
}
