import { MediaListItem } from '../../shared';

export interface UserDataSummary {
    readonly favoriteMovies: number;
    readonly favoriteTv: number;
    readonly watchlistMovies: number;
    readonly watchlistTv: number;
    readonly ratedMovies: number;
    readonly ratedTv: number;
    readonly ratedEpisodes: number;
    readonly lists: number;
}

export interface UserDataListItem {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly itemCount: number;
    readonly metadata: string;
    readonly updatedLabel: string | null;
    readonly posterPath: string | null;
}

export interface UserRatedMediaItem {
    readonly media: MediaListItem;
    readonly userRating: number | null;
    readonly ratedAt: string | null;
}

export interface UserRatedEpisodeItem {
    readonly id: number;
    readonly showId: number | null;
    readonly showName: string | null;
    readonly name: string;
    readonly overview: string;
    readonly seasonNumber: number | null;
    readonly episodeNumber: number | null;
    readonly airDate: string;
    readonly runtime: number | null;
    readonly voteAverage: number | null;
    readonly stillPath: string | null;
    readonly userRating: number | null;
    readonly ratedAt: string | null;
}

export interface UserDataOverviewStat {
    readonly label: string;
    readonly value: number;
    readonly route: string;
}
