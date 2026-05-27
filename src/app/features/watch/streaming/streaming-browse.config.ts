import { getCurrentMonthName } from '../../../shared';
import { StreamingEditorialSection } from '../models/streaming-browse.models';

export const STREAMING_THIS_MONTH_SLUG = 'streaming-this-month';
export const AIRING_TODAY_SLUG = 'airing-today';

export const getStreamingThisMonthTitle = (): string => `Find out what's streaming in ${getCurrentMonthName()}`;

export const getStreamingThisMonthCtaLabel = (): string => `Browse ${getCurrentMonthName()} arrivals`;

export const STREAMING_EDITORIAL_SECTIONS: readonly StreamingEditorialSection[] = [
    {
        slug: STREAMING_THIS_MONTH_SLUG,
        title: "This month's streaming arrivals",
        description: 'A focused mix of recent movie releases and TV premieres available through streaming providers.',
        ctaLabel: 'Browse arrivals',
        baseQuery: {
            mediaTypes: ['movie', 'tv'],
            monetization: 'flatrate',
            datePreset: 'current-month',
            sortBy: 'release_date',
        },
    },
    {
        slug: AIRING_TODAY_SLUG,
        title: 'Airing today',
        description:
            'Popular TV series with episodes scheduled today, tuned for a quick check-in before the evening starts.',
        ctaLabel: "See today's shows",
        baseQuery: {
            mediaTypes: ['tv'],
            datePreset: 'today',
            sortBy: 'popularity',
        },
    },
    {
        slug: 'anime-premieres',
        title: 'Japanese animation premieres',
        description:
            'New and popular animated series from Japan, tuned for seasonal discoveries rather than a full catalog dump.',
        ctaLabel: 'Find anime premieres',
        baseQuery: {
            mediaTypes: ['tv'],
            genreIds: [16],
            originalLanguage: 'ja',
            datePreset: 'current-season',
            sortBy: 'popularity',
        },
    },
    {
        slug: 'short-streaming-movies',
        title: 'Short watches for movie night',
        description: 'Streaming movies that keep the runtime lean without turning the evening into a marathon.',
        ctaLabel: 'See short movies',
        baseQuery: {
            mediaTypes: ['movie'],
            monetization: 'flatrate',
            runtimeMax: 100,
            sortBy: 'popularity',
        },
    },
    {
        slug: 'hidden-streaming-gems',
        title: 'Hidden streaming gems',
        description:
            'Less obvious movies and shows with strong audience scores, filtered away from the usual front-page defaults.',
        ctaLabel: 'Uncover gems',
        baseQuery: {
            mediaTypes: ['movie', 'tv'],
            monetization: 'flatrate',
            voteAverageMin: 7.5,
            voteCountMin: 200,
            voteCountMax: 1000,
            sortBy: 'rating',
        },
    },
];
