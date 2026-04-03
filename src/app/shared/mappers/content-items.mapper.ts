import { CollectionPart, MultiListItem } from '../../api';
import type { MediaType } from '../types';
import {
    CardItem,
    KnownForLink,
    PersonCardItem,
    VideoTrailerSeedItem,
    MediaListItem,
    PersonListItem,
    SearchResultItem,
} from '../models';

type DatePrecision = 'year' | 'full';

type MovieLike = {
    id?: number | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
    title?: string | null;
    genre_ids?: number[] | null;
    release_date?: string | null;
    overview?: string | null;
    vote_average?: number | null;
    vote_count?: number | null;
    popularity?: number | null;
};

type TvLike = {
    id?: number | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
    name?: string | null;
    genre_ids?: number[] | null;
    first_air_date?: string | null;
    overview?: string | null;
    vote_average?: number | null;
    vote_count?: number | null;
    popularity?: number | null;
};

type PersonKnownForLike = {
    id?: number | null;
    title?: string | null;
    name?: string | null;
    media_type?: string | null;
};

type PersonLike = {
    id?: number | null;
    profile_path?: string | null;
    name?: string | null;
    known_for_department?: string | null;
    known_for?: PersonKnownForLike[] | null;
};

type CastLike = {
    id?: number | null;
    profile_path?: string | null;
    name?: string | null;
    character?: string | null;
};

const toDateValue = (
    date: string | null | undefined,
    precision: DatePrecision,
): string => {
    const value = date ?? '';
    return precision === 'year' ? value.slice(0, 4) : value;
};

const toKnownForLinks = (
    items: PersonKnownForLike[] | null | undefined,
): KnownForLink[] =>
    (items ?? [])
        .filter((item) => !!item.id && !!(item.title || item.name))
        .map((item) => ({
            id: item.id!,
            title: item.title || item.name || '',
            mediaType: (item.media_type || 'movie') as MediaType,
        }));

const toKnownForText = (knownForLinks: KnownForLink[]): string | undefined => {
    if (!knownForLinks.length) {
        return undefined;
    }
    return knownForLinks.map((item) => item.title).join(', ');
};

const toVideoTrailerSeed = (
    item: {
        id?: number | null;
        poster_path?: string | null;
        backdrop_path?: string | null;
    },
    mediaType: MediaType,
    mediaTitle: string | null | undefined,
    mediaDate: string | null | undefined,
): VideoTrailerSeedItem => ({
    mediaId: item.id ?? 0,
    mediaType,
    mediaTitle: mediaTitle ?? '',
    mediaYear: toDateValue(mediaDate, 'year'),
    mediaPosterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
});

export const toMovieMediaListItem = (
    item: MovieLike,
    datePrecision: DatePrecision = 'full',
): MediaListItem => ({
    id: item.id ?? 0,
    thumb: item.poster_path ?? null,
    title: item.title ?? '',
    overview: item.overview ?? '',
    rating: item.vote_average ?? null,
    date: toDateValue(item.release_date, datePrecision),
    mediaType: 'movie',
    genreIds: item.genre_ids ?? [],
    voteCount: item.vote_count ?? 0,
});

export const toTvMediaListItem = (
    item: TvLike,
    datePrecision: DatePrecision = 'full',
): MediaListItem => ({
    id: item.id ?? 0,
    thumb: item.poster_path ?? null,
    title: item.name ?? '',
    overview: item.overview ?? '',
    rating: item.vote_average ?? null,
    date: toDateValue(item.first_air_date, datePrecision),
    mediaType: 'tv',
    genreIds: item.genre_ids ?? [],
    voteCount: item.vote_count ?? 0,
});

export const toCollectionPartMediaListItem = (
    item: CollectionPart,
    datePrecision: DatePrecision = 'full',
): MediaListItem =>
    toMovieMediaListItem(
        {
            id: item.id,
            poster_path: item.poster_path,
            title: item.title,
            overview: item.overview,
            vote_average: item.vote_average,
            vote_count: item.vote_count,
            release_date: item.release_date,
        },
        datePrecision,
    );

export const toPersonListItem = (person: PersonLike): PersonListItem => ({
    id: person.id ?? 0,
    thumb: person.profile_path ?? null,
    title: person.name ?? '',
    department: person.known_for_department ?? '',
    knownForLinks: toKnownForLinks(person.known_for),
});

export const toPersonCardItem = (person: PersonLike): PersonCardItem => ({
    id: person.id ?? 0,
    name: person.name ?? '',
    imagePath: person.profile_path ?? null,
    subtitle: person.known_for_department ?? '',
});

export const toCastPersonCardItem = (person: CastLike): PersonCardItem => ({
    id: person.id ?? 0,
    name: person.name ?? '',
    imagePath: person.profile_path ?? null,
    subtitle: person.character ?? '',
});

export const movieToSearchResultItem = (item: MovieLike): SearchResultItem => ({
    ...toMovieMediaListItem(item, 'year'),
    year: toDateValue(item.release_date, 'year'),
    mediaType: 'movie',
    department: '',
});

export const tvToSearchResultItem = (item: TvLike): SearchResultItem => ({
    ...toTvMediaListItem(item, 'year'),
    year: toDateValue(item.first_air_date, 'year'),
    mediaType: 'tv',
    department: '',
});

export const personToSearchResultItem = (
    person: PersonLike,
): SearchResultItem => {
    const knownForLinks = toKnownForLinks(person.known_for);
    return {
        id: person.id ?? 0,
        thumb: person.profile_path ?? null,
        title: person.name ?? '',
        year: '',
        mediaType: 'person',
        overview: '',
        rating: null,
        department: person.known_for_department ?? '',
        known_for: toKnownForText(knownForLinks),
    };
};

export const multiToSearchResultItem = (
    item: MultiListItem,
): SearchResultItem => {
    const knownForLinks = toKnownForLinks(item.known_for);
    return {
        id: item.id ?? 0,
        thumb: item.poster_path || item.profile_path || null,
        title: item.title || item.name || '',
        year: toDateValue(item.release_date || item.first_air_date, 'year'),
        mediaType: item.media_type || 'movie',
        overview: item.overview || '',
        rating: item.vote_average ?? null,
        department: item.known_for_department || '',
        known_for: toKnownForText(knownForLinks),
    };
};

export const toMovieCardItem = (item: MovieLike): CardItem => ({
    id: item.id ?? 0,
    mediaType: 'movie',
    title: item.title ?? '',
    imagePath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    rating: item.vote_average ?? null,
    date: item.release_date ?? '',
    overview: item.overview ?? '',
});

export const toTvCardItem = (item: TvLike): CardItem => ({
    id: item.id ?? 0,
    mediaType: 'tv',
    title: item.name ?? '',
    imagePath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    rating: item.vote_average ?? null,
    date: item.first_air_date ?? '',
    overview: item.overview ?? '',
});

export const toMovieVideoTrailerSeed = (
    item: MovieLike,
): VideoTrailerSeedItem =>
    toVideoTrailerSeed(item, 'movie', item.title, item.release_date);

export const toTvVideoTrailerSeed = (item: TvLike): VideoTrailerSeedItem =>
    toVideoTrailerSeed(item, 'tv', item.name, item.first_air_date);

