import { Video } from '../../api';

export const buildYoutubeWatchUrl = (key: string): string =>
    `https://www.youtube.com/watch?v=${key}`;

export const buildYoutubeThumbnailUrl = (key: string): string =>
    `https://img.youtube.com/vi/${key}/hqdefault.jpg`;

export const pickBestYoutubeTrailer = (videos: Video[]): Video | null => {
    const candidates = videos.filter(
        (video) =>
            video.site === 'YouTube' &&
            !!video.key &&
            video.type === 'Trailer',
    );

    if (!candidates.length) {
        return null;
    }

    return (
        candidates.find((video) => video.type === 'Trailer' && video.official) ??
        candidates[0]
    );
};
