import { MovieListItem, RatedMovieListItem, RatedTvSeriesListItem, TvSeriesListItem } from '../../api';
import {
    CardItem,
    MediaListItem,
    MediaType,
    RemoteData,
    toCardItem,
    toMediaListItem,
} from '../../shared';

type UserAccountMediaItem = MovieListItem | TvSeriesListItem | RatedMovieListItem | RatedTvSeriesListItem;

interface MediaIdentity {
    readonly id: number;
    readonly mediaType: MediaType;
}

export function toUserMediaTotalLabel(mediaType: MediaType, totalResults: number): string {
    if (mediaType === 'tv') {
        return `${totalResults} TV series`;
    }

    return `${totalResults} movie${totalResults === 1 ? '' : 's'}`;
}

export function toUserAccountMediaListItem(
    item: UserAccountMediaItem,
    mediaType: MediaType,
    rating?: number | null,
): MediaListItem | null {
    const mediaItem = toMediaListItem(item, mediaType, 'year');
    const title = mediaItem.title;

    if (!mediaItem.id || !title) {
        return null;
    }

    return {
        ...mediaItem,
        title,
        overview: mediaItem.overview,
        rating: rating === undefined ? mediaItem.rating : rating,
    };
}

export function toUserAccountCardItem(
    item: UserAccountMediaItem,
    mediaType: MediaType,
    rating?: number | null,
): CardItem | null {
    const cardItem = toCardItem(item, mediaType);
    const title = cardItem.title;

    if (!cardItem.id || !title) {
        return null;
    }

    return {
        ...cardItem,
        title,
        overview: cardItem.overview,
        rating: rating === undefined ? cardItem.rating : rating,
    };
}

export function toTotalAfterMediaRemoval<T extends MediaIdentity>(
    itemsState: RemoteData<readonly T[]>,
    item: MediaIdentity,
    totalResults: number,
): number {
    const itemWasLoaded =
        itemsState.state === 'success' &&
        itemsState.data.some((pageItem) => pageItem.id === item.id && pageItem.mediaType === item.mediaType);

    return itemWasLoaded ? Math.max(0, totalResults - 1) : totalResults;
}
