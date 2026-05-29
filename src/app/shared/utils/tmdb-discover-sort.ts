import type { MediaType, SortDirection } from '../types';

export type TmdbDiscoverSortKey =
    | 'popularity'
    | 'rating'
    | 'release_date'
    | 'title'
    | 'vote_count';

const MOVIE_SORT_FIELDS: Record<TmdbDiscoverSortKey, string> = {
    popularity: 'popularity',
    rating: 'vote_average',
    release_date: 'primary_release_date',
    title: 'title',
    vote_count: 'vote_count',
};

const TV_SORT_FIELDS: Record<TmdbDiscoverSortKey, string> = {
    popularity: 'popularity',
    rating: 'vote_average',
    release_date: 'first_air_date',
    title: 'name',
    vote_count: 'vote_count',
};

export function toTmdbDiscoverSort(
    mediaType: MediaType,
    sortKey: TmdbDiscoverSortKey,
    direction: SortDirection,
): string {
    const fields = mediaType === 'movie' ? MOVIE_SORT_FIELDS : TV_SORT_FIELDS;

    return `${fields[sortKey]}.${direction}`;
}
