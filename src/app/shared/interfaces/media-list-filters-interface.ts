export interface MediaListFilters {
  fromDate?: Date;
  toDate?: Date;
  page: number;
  sortBy: string;
  genres: string[];
  minVoteCount: number | undefined;
  voteAverage: number[];
}
