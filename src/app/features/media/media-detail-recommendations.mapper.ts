import { Movie, MovieListItem, TvSeries, TvSeriesListItem } from '../../api';

import type { MediaType } from '../../shared';

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
