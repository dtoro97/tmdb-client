import { Language, Movie, TvSeries } from '../../api';
import { MediaDetails } from '../models';
import type { MediaType } from '../types';

export const toMediaDetails = (
    media: Movie | TvSeries,
    mediaType: MediaType,
    languages: Language[],
): MediaDetails => {
    const isTv = mediaType === 'tv';
    const tv = isTv ? (media as TvSeries) : undefined;
    const movie = isTv ? undefined : (media as Movie);

    const langCodes = isTv
        ? (tv!.languages ?? [])
        : [movie!.original_language ?? ''].filter(Boolean);

    const resolvedLanguages = languages.length
        ? langCodes.map(
              (code) =>
                  languages.find((l) => l.iso_639_1 === code)?.english_name ??
                  code,
          )
        : langCodes;

    const date = isTv ? tv!.first_air_date : movie!.release_date;

    return {
        id: media.id!,
        title: isTv ? (tv!.name ?? '') : (movie!.title ?? ''),
        year: date ? date.substring(0, 4) : '',
        overview: media.overview ?? '',
        genres: media.genres ?? [],
        voteAverage: media.vote_average ?? 0,
        posterPath: media.poster_path ?? null,
        backdropPath: media.backdrop_path ?? null,
        status: media.status,
        languages: resolvedLanguages,
        mediaType,
        homepage: media.homepage ?? '',
        tagline: media.tagline || undefined,

        releaseDate: movie?.release_date,
        runtime: movie?.runtime,
        budget: movie?.budget,
        revenue: movie?.revenue,

        firstAirDate: tv?.first_air_date,
        lastAirDate: tv?.last_air_date,
        creators: tv?.created_by,
        numberOfSeasons: tv?.number_of_seasons,
        numberOfEpisodes: tv?.number_of_episodes,
        networks: tv?.networks,
        nextEpisode: tv?.next_episode_to_air,
        lastEpisode: tv?.last_episode_to_air,
        voteCount: media.vote_count ?? 0,
    };
};
