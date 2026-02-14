import { Params } from '@angular/router';
import { MediaListFilters } from '../interfaces/media-list-filters-interface';
import { DateHelper } from './date.helper';
import { MediaType } from '../constants/media-type.constants';

export class FilterQueryConverter {
  static toQueryParams(filters: MediaListFilters, mediaType: string): Params {
    const queryParams: Record<string, any> = {};
    const releaseDateField = mediaType === MediaType.TV ? 'first_air_date' : 'primary_release_date';

    queryParams['page'] = filters.page;
    queryParams['sort_by'] = filters.sortBy;

    if (filters.fromDate) {
      queryParams[`${releaseDateField}.gte`] = this.formatDate(filters.fromDate);
    }

    if (filters.toDate) {
      queryParams[`${releaseDateField}.lte`] = this.formatDate(filters.toDate);
    }

    if (filters.genres.length > 0) {
      queryParams['with_genres'] = filters.genres.join('|');
    }

    if (filters.voteAverage?.[0]) {
      queryParams['vote_average.gte'] = filters.voteAverage[0];
    }

    if (filters.voteAverage?.[1]) {
      queryParams['vote_average.lte'] = filters.voteAverage[1];
    }

    if (filters.minVoteCount) {
      queryParams['vote_count.gte'] = filters.minVoteCount;
    }

    return queryParams;
  }

  static toFilters(queryParams: Params, mediaType: string): MediaListFilters {
    const releaseDateField = mediaType === MediaType.TV ? 'first_air_date' : 'primary_release_date';

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    const fromParam = queryParams[`${releaseDateField}.gte`];
    const toParam = queryParams[`${releaseDateField}.lte`];

    if (DateHelper.isValidDate(fromParam)) {
      fromDate = new Date(fromParam);
    }

    if (DateHelper.isValidDate(toParam)) {
      toDate = new Date(toParam);
    }

    const genres = queryParams['with_genres']
      ? queryParams['with_genres'].split('|')
      : [];

    const voteAverageMin = queryParams['vote_average.gte']
      ? Number(queryParams['vote_average.gte'])
      : 0;

    const voteAverageMax = queryParams['vote_average.lte']
      ? Number(queryParams['vote_average.lte'])
      : 10;

    const minVoteCount = queryParams['vote_count.gte']
      ? Number(queryParams['vote_count.gte'])
      : undefined;

    return {
      sortBy: queryParams['sort_by'],
      fromDate,
      toDate,
      genres,
      voteAverage: [voteAverageMin, voteAverageMax],
      minVoteCount,
      page: Number(queryParams['page']) || 1
    };
  }

  private static formatDate(date: Date): string {
    return DateHelper.formatToISO(date);
  }
}
