import { MultiListItem } from '../../api';
import type { MediaType } from '../../shared';

export interface SpotlightItem {
    id: number;
    mediaType: MediaType;
    title: string;
    overview: string;
    backdropPath: string | null;
    rating: number | null;
    year: string;
    mediaTypeLabel: string;
}

export const toSpotlightItem = (item: MultiListItem): SpotlightItem | null => {
    if (!item.backdrop_path || !item.id) {
        return null;
    }

    const isMovie = item.media_type === 'movie';
    const title = isMovie ? item.title : item.name;
    const date = isMovie ? item.release_date : item.first_air_date;

    return {
        id: item.id,
        mediaType: isMovie ? 'movie' : 'tv',
        title: title ?? '',
        overview: item.overview ?? '',
        backdropPath: item.backdrop_path,
        rating: item.vote_average ?? null,
        year: (date ?? '').slice(0, 4),
        mediaTypeLabel: isMovie ? 'Movie' : 'TV Series',
    };
};
