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
    readonly description: string;
    readonly itemCount: number;
    readonly favoriteCount: number;
    readonly posterPath: string | null;
}

export interface UserRatedMediaItem {
    readonly media: MediaListItem;
    readonly userRating: number | null;
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
}

export interface UserDataOverviewStat {
    readonly label: string;
    readonly value: number;
    readonly route: string;
}

export interface UserDataOverviewRatingPreviewItem {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly imagePath: string | null;
    readonly routeLink: readonly (string | number)[];
    readonly userRating: number | null;
}

export interface UserDataOverviewListPreviewItem {
    readonly id: number;
    readonly name: string;
    readonly description: string;
    readonly metadata: string;
    readonly posterPath: string | null;
}
