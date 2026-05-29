import { MediaType } from '../../shared';

export interface MediaTarget {
    readonly id: number;
    readonly type: MediaType;
}

export interface EpisodeTarget {
    readonly seriesId: number;
    readonly seasonNumber: number;
    readonly episodeNumber: number;
}

export const toMediaKey = (target: MediaTarget): string => `${target.type}:${target.id}`;

export const isSameMediaTarget = (left: MediaTarget | null, right: MediaTarget): boolean =>
    left?.id === right.id && left.type === right.type;

export const isSameEpisodeTarget = (left: EpisodeTarget | null, right: EpisodeTarget): boolean =>
    left?.seriesId === right.seriesId &&
    left.seasonNumber === right.seasonNumber &&
    left.episodeNumber === right.episodeNumber;
