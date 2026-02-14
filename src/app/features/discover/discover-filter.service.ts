import { Injectable } from '@angular/core';
import { Params } from '@angular/router';

import { MediaTypeEnum } from '../../shared/constants/media-type.constants';
import { DateHelper } from '../../shared/utils/date.helper';
import { Option } from '../../shared/interfaces/option.interface';

export interface DiscoverFilters {
  fromDate?: Date;
  toDate?: Date;
  page: number;
  sortBy: string;
  genres: string[];
  minVoteCount: number | undefined;
  voteAverage: number[];
}

const commonSortOptions: Option[] = [
  { label: 'Popularity Descending', value: 'popularity.desc' },
  { label: 'Popularity Ascending', value: 'popularity.asc' },
  { label: 'Rating Descending', value: 'vote_average.desc' },
  { label: 'Rating Ascending', value: 'vote_average.asc' },
];

const movieSpecificOptions: Option[] = [
  { label: 'Release Date Descending', value: 'primary_release_date.desc' },
  { label: 'Release Date Ascending', value: 'primary_release_date.asc' },
  { label: 'Title A-Z', value: 'title.asc' },
  { label: 'Title Z-A', value: 'title.desc' },
];

const tvSpecificOptions: Option[] = [
  { label: 'First Aired Descending', value: 'first_air_date.desc' },
  { label: 'First Aired Ascending', value: 'first_air_date.asc' },
  { label: 'Title A-Z', value: 'name.asc' },
  { label: 'Title Z-A', value: 'name.desc' },
];

@Injectable({ providedIn: 'root' })
export class DiscoverFilterService {
  getSortOptions(type: string): Option[] {
    return type === MediaTypeEnum.TV
      ? [...commonSortOptions, ...tvSpecificOptions]
      : [...commonSortOptions, ...movieSpecificOptions];
  }

  toQueryParams(filters: DiscoverFilters, mediaType: string): Params {
    const queryParams: Record<string, any> = {};
    const releaseDateField =
      mediaType === MediaTypeEnum.TV
        ? 'first_air_date'
        : 'primary_release_date';

    queryParams['page'] = filters.page;
    queryParams['sort_by'] = filters.sortBy;

    if (filters.fromDate) {
      queryParams[`${releaseDateField}.gte`] = DateHelper.formatToISO(
        filters.fromDate,
      );
    }

    if (filters.toDate) {
      queryParams[`${releaseDateField}.lte`] = DateHelper.formatToISO(
        filters.toDate,
      );
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

  toFilters(queryParams: Params, mediaType: string): DiscoverFilters {
    const releaseDateField =
      mediaType === MediaTypeEnum.TV
        ? 'first_air_date'
        : 'primary_release_date';

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
      page: Number(queryParams['page']) || 1,
    };
  }
}
