import type { MediaType } from '../types';

export interface KnownForLink {
    id: number;
    title: string;
    mediaType: MediaType;
}

export interface PersonLink {
    id: number;
    name: string;
}

export interface MediaListItem {
    id: number;
    thumb: string | null;
    title: string;
    overview: string;
    rating: number | null;
    date: string;
    mediaType: string;
    genreIds?: number[];
    voteCount?: number;
    castLinks?: PersonLink[];
}

export interface PersonListItem {
    id: number;
    thumb: string | null;
    title: string;
    department: string;
    knownForLinks: KnownForLink[];
}

export interface PersonCardItem {
    id: number;
    name: string;
    imagePath: string | null;
    subtitle: string;
}

export interface SearchResultItem {
    id: number;
    thumb: string | null;
    title: string;
    year: string;
    mediaType: string;
    overview: string;
    rating: number | null;
    department: string;
    known_for?: string;
}

export type CardItem<TExtra extends object = object> = {
    id: number;
    mediaType: MediaType;
    title: string;
    imagePath: string | null;
    backdropPath: string | null;
    rating: number | null;
    date: string;
    overview: string;
    role?: string;
} & TExtra;

export interface VideoTrailerSeedItem {
    mediaId: number;
    mediaType: MediaType;
    mediaTitle: string;
    mediaYear: string;
    mediaOverview: string;
    mediaPosterPath: string | null;
    backdropPath: string | null;
}

