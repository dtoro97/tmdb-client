import {
    ContentRatingList,
    ExternalIds,
    Movie,
    MovieListItem,
    ReleaseDateList,
    Review,
    ReviewPage,
    TvSeries,
    TvSeriesListItem,
    TvEpisode,
    WatchProviderItem,
    WatchProviderList,
} from '../../api';
import { ExternalLinks, LoadableValue, MediaDetails } from '../../shared';
import type { MediaType } from '../../shared';
import {
    MediaCreditsLinkItem,
    MediaDetailProviderPreview,
} from './media-detail.models';

const HERO_PROVIDER_PREVIEW_COUNT = 3;

export interface WatchProviderCategories {
    flatrate: WatchProviderItem[];
    rent: WatchProviderItem[];
    buy: WatchProviderItem[];
    link?: string;
    region: string;
}

const normalizeProviderItems = (
    providers?: WatchProviderItem[],
): WatchProviderItem[] => {
    const seen = new Set<number>();

    return [...(providers ?? [])]
        .filter(
            (provider): provider is WatchProviderItem =>
                !!provider.provider_id &&
                !!provider.provider_name &&
                !!provider.logo_path,
        )
        .sort(
            (a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999),
        )
        .filter((provider) => {
            if (seen.has(provider.provider_id!)) {
                return false;
            }

            seen.add(provider.provider_id!);
            return true;
        });
};

export const pickWatchProviderCategories = (
    providers: WatchProviderList | null | undefined,
    country: string,
): WatchProviderCategories | null => {
    const results = providers?.results ?? {};
    const region =
        (results[country] && country) ||
        (results['US'] && 'US') ||
        Object.keys(results)[0];

    if (!region) {
        return null;
    }

    const regionProviders = results[region];
    const flatrate = normalizeProviderItems(regionProviders.flatrate);
    const rent = normalizeProviderItems(regionProviders.rent);
    const buy = normalizeProviderItems(regionProviders.buy);

    if (!flatrate.length && !rent.length && !buy.length) {
        return null;
    }

    return {
        region,
        link: regionProviders.link,
        flatrate,
        rent,
        buy,
    };
};

export const extractMovieCertification = (
    releaseDates: ReleaseDateList | null | undefined,
    country: string,
): string | null => {
    const countryDates = (releaseDates?.results ?? []).find(
        (result) => result.iso_3166_1 === country,
    );

    return (
        countryDates?.release_dates
            ?.map((release) => release.certification?.trim())
            .find(
                (certification): certification is string => !!certification,
            ) ?? null
    );
};

export const extractTvCertification = (
    ratings: ContentRatingList | null | undefined,
    country: string,
): string | null => {
    const rating = (ratings?.results ?? []).find(
        (result) => result.iso_3166_1 === country,
    )?.rating;

    const trimmed = rating?.trim();
    return trimmed ? trimmed : null;
};

export const normalizeAllReviews = (
    reviewPage: ReviewPage | null | undefined,
): Review[] =>
    (reviewPage?.results ?? []).filter(
        (review): review is Review => !!review.id && !!review.content?.trim(),
    );

export const shouldShowCreditsPanel = (
    castState: { type: string; value?: unknown[] },
    crewState: { type: string; value?: unknown[] },
    creatorsCount: number,
): boolean => {
    const hasLoadedItems = (state: { type: string; value?: unknown[] }) =>
        state.type === 'loaded' && (state.value?.length ?? 0) > 0;

    return (
        castState.type !== 'loaded' ||
        crewState.type !== 'loaded' ||
        hasLoadedItems(castState) ||
        hasLoadedItems(crewState) ||
        creatorsCount > 0
    );
};

export const toCreditsLinkItems = (
    items: ReadonlyArray<{ id?: number | null; name?: string | null }>,
): MediaCreditsLinkItem[] =>
    items.map((item) => ({
        id: item.id,
        name: item.name,
    }));

export const buildProviderPreview = (
    providers: WatchProviderCategories | null,
    maxVisible = HERO_PROVIDER_PREVIEW_COUNT,
): MediaDetailProviderPreview | null => {
    if (!providers) {
        return null;
    }

    const seen = new Set<number>();
    const previewProviders = [
        ...providers.flatrate,
        ...providers.rent,
        ...providers.buy,
    ].filter((provider): provider is WatchProviderItem => {
        const providerId = provider.provider_id;

        if (!providerId || seen.has(providerId)) {
            return false;
        }

        seen.add(providerId);
        return true;
    });

    if (!previewProviders.length) {
        return null;
    }

    return {
        providers: previewProviders.slice(0, maxVisible),
        hiddenCount: Math.max(0, previewProviders.length - maxVisible),
        link: providers.link ?? null,
    };
};

export const sortReviewsForPreview = (reviews: Review[]): Review[] =>
    [...reviews].sort((left, right) => {
        const leftHasRating = typeof left.author_details?.rating === 'number';
        const rightHasRating = typeof right.author_details?.rating === 'number';

        if (leftHasRating === rightHasRating) {
            return 0;
        }

        return leftHasRating ? -1 : 1;
    });

const toYear = (date?: string): string | null => (date ? date.slice(0, 4) : null);

export const toTvYearLabel = (media: MediaDetails): string | null => {
    if (media.mediaType !== 'tv') {
        return null;
    }

    const firstYear = toYear(media.firstAirDate);
    const lastYear = toYear(media.lastAirDate);

    if (!firstYear) {
        return null;
    }

    if (!lastYear || firstYear === lastYear) {
        return firstYear;
    }

    return `${firstYear} - ${lastYear}`;
};

export const toLatestEpisodeState = (
    lastEpisode: MediaDetails['lastEpisode'],
): LoadableValue<TvEpisode | null> =>
    lastEpisode
        ? {
              type: 'loaded',
              value: lastEpisode as TvEpisode,
          }
        : { type: 'idle' };

export const mapLoadableValue = <T, U>(
    state: LoadableValue<T>,
    mapValue: (value: T) => U,
): LoadableValue<U> => {
    if (state.type !== 'loaded') {
        return state;
    }

    return {
        type: 'loaded',
        value: mapValue(state.value),
    };
};

export const buildMediaExternalLinks = (
    links: ExternalIds | null,
    homepage: string | null,
): ExternalLinks | null => {
    if (!links && !homepage) {
        return null;
    }

    return {
        links,
        homepage,
        imdbType: 'title',
    };
};

type RelatedMediaListItem = MovieListItem | TvSeriesListItem;
type RelatedMediaSource = 'similar' | 'recommendation';

interface RelatedMediaCandidate {
    item: RelatedMediaListItem;
    source: RelatedMediaSource;
    sourceIndex: number;
    appearsInBoth: boolean;
}

const toItemYear = (item: RelatedMediaListItem): number | null => {
    const date =
        'title' in item
            ? (item as MovieListItem).release_date
            : (item as TvSeriesListItem).first_air_date;
    const year = date ? Number(date.slice(0, 4)) : NaN;

    return Number.isFinite(year) ? year : null;
};

const toItemGenreIds = (item: RelatedMediaListItem): number[] =>
    (item.genre_ids ?? []).filter((genreId): genreId is number => !!genreId);

const toSourceYear = (
    media: Movie | TvSeries,
    mediaType: MediaType,
): number | null => {
    const date =
        mediaType === 'movie'
            ? (media as Movie).release_date
            : (media as TvSeries).first_air_date;
    const year = date ? Number(date.slice(0, 4)) : NaN;

    return Number.isFinite(year) ? year : null;
};

const toSourceGenreIds = (media: Movie | TvSeries): Set<number> =>
    new Set(
        (media.genres ?? [])
            .map((genre) => genre.id)
            .filter((genreId): genreId is number => !!genreId),
    );

const toSourceLanguage = (media: Movie | TvSeries): string =>
    media.original_language ?? '';

const scoreRelatedCandidate = (
    candidate: RelatedMediaCandidate,
    sourceGenreIds: Set<number>,
    sourceYear: number | null,
    sourceLanguage: string,
): number => {
    const candidateGenreIds = toItemGenreIds(candidate.item);
    const overlapCount = candidateGenreIds.filter((genreId) =>
        sourceGenreIds.has(genreId),
    ).length;

    let score = 0;

    if (candidate.appearsInBoth) {
        score += 4;
    }

    score += overlapCount * 3;

    if (overlapCount === 0) {
        score -= 4;
    }

    const candidateYear = toItemYear(candidate.item);

    if (sourceYear && candidateYear) {
        const diff = Math.abs(sourceYear - candidateYear);

        if (diff <= 1) {
            score += 2.5;
        } else if (diff <= 3) {
            score += 1.5;
        } else if (diff <= 7) {
            score += 0.5;
        } else if (diff >= 15) {
            score -= 1;
        }
    }

    if ((candidate.item.original_language ?? '') === sourceLanguage) {
        score += 1;
    }

    if (candidate.source === 'similar') {
        score += 2;
    }

    return score;
};

export const rankRelatedMedia = (
    sourceMedia: Movie | TvSeries,
    mediaType: MediaType,
    similarItems: RelatedMediaListItem[],
    recommendationItems: RelatedMediaListItem[],
    pageSize: number,
): RelatedMediaListItem[] => {
    const candidates = new Map<number, RelatedMediaCandidate>();
    const sourceGenreIds = toSourceGenreIds(sourceMedia);
    const sourceYear = toSourceYear(sourceMedia, mediaType);
    const sourceLanguage = toSourceLanguage(sourceMedia);

    similarItems.forEach((item, index) => {
        const id = item.id;

        if (!id || id === sourceMedia.id) {
            return;
        }

        candidates.set(id, {
            item,
            source: 'similar',
            sourceIndex: index,
            appearsInBoth: false,
        });
    });

    recommendationItems.forEach((item, index) => {
        const id = item.id;

        if (!id || id === sourceMedia.id) {
            return;
        }

        const existing = candidates.get(id);

        if (existing) {
            candidates.set(id, {
                ...existing,
                item: existing.source === 'similar' ? existing.item : item,
                appearsInBoth: true,
            });
            return;
        }

        candidates.set(id, {
            item,
            source: 'recommendation',
            sourceIndex: index,
            appearsInBoth: false,
        });
    });

    return [...candidates.values()]
        .sort((left, right) => {
            const scoreDiff =
                scoreRelatedCandidate(
                    right,
                    sourceGenreIds,
                    sourceYear,
                    sourceLanguage,
                ) -
                scoreRelatedCandidate(
                    left,
                    sourceGenreIds,
                    sourceYear,
                    sourceLanguage,
                );

            if (scoreDiff !== 0) {
                return scoreDiff;
            }

            return left.sourceIndex - right.sourceIndex;
        })
        .map((candidate) => candidate.item)
        .slice(0, pageSize);
};
