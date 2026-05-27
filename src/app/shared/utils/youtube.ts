import { Video } from '../../api';
import type { LoadableItems } from '../types';

interface PickBestYoutubeTrailerOptions {
    readonly requirePreferredLanguage?: boolean;
}

export const buildYoutubeWatchUrl = (key: string): string =>
    `https://www.youtube.com/watch?v=${key}`;

export const buildYoutubeThumbnailUrl = (key: string): string =>
    `https://img.youtube.com/vi/${key}/hqdefault.jpg`;

export const isYoutubeVideo = (video: Video): boolean => video.site === 'YouTube';

export const compareVideosTrailerFirst = (left: Video, right: Video): number =>
    videoTypeRank(left) - videoTypeRank(right);

export const sortVideosTrailerFirst = <T extends Video>(videos: readonly T[]): T[] =>
    [...videos].sort(compareVideosTrailerFirst);

export const toYoutubeTrailerFirstVideoState = (
    state: LoadableItems<Video>,
): LoadableItems<Video> => {
    if (state.type === 'loaded') {
        return {
            type: 'loaded',
            value: sortVideosTrailerFirst(state.value.filter(isYoutubeVideo)),
        };
    }

    if (state.type === 'loading-more') {
        return {
            type: 'loading-more',
            value: sortVideosTrailerFirst(state.value.filter(isYoutubeVideo)),
            placeholderCount: state.placeholderCount,
        };
    }

    return state;
};

export const pickBestYoutubeTrailer = (
    videos: Video[],
    preferredLanguage?: string,
    options: PickBestYoutubeTrailerOptions = {},
): Video | null => {
    const candidates = videos.filter(
        (video) =>
            video.site === 'YouTube' &&
            !!video.key &&
            video.type === 'Trailer',
    );

    if (!candidates.length) {
        return null;
    }

    const normalizedLanguage = preferredLanguage?.toLowerCase();

    if (normalizedLanguage) {
        const preferredOfficial = candidates.find(
            (video) => video.official && isVideoLanguage(video, normalizedLanguage),
        );
        const preferred = candidates.find((video) => isVideoLanguage(video, normalizedLanguage));

        if (options.requirePreferredLanguage) {
            return preferredOfficial ?? preferred ?? null;
        }

        return (
            preferredOfficial ??
            preferred ??
            candidates.find((video) => video.official) ??
            candidates[0]
        );
    }

    return (
        candidates.find((video) => video.type === 'Trailer' && video.official) ??
        candidates[0]
    );
};

const videoTypeRank = (video: Video): number =>
    video.type?.toLowerCase() === 'trailer' ? 0 : 1;

const isVideoLanguage = (video: Video, language: string): boolean =>
    (video.iso_639_1 ?? '').toLowerCase() === language;
