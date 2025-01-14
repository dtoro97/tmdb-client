export interface MediaListFilters {
  fromDate?: Date;
  toDate?: Date;
  page: 1;
  sortBy: string;
  genres: string[];
  minVoteCount: number;
  voteAverage?: number[];
}
