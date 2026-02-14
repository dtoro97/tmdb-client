import { Option } from '../../shared';

const commonSortOptions: Option[] = [
  {
    label: 'Popularity Descending',
    value: 'popularity.desc',
  },
  {
    label: 'Popularity Ascending',
    value: 'popularity.asc',
  },
  {
    label: 'Rating Descending',
    value: 'vote_average.desc',
  },
  {
    label: 'Rating Ascending',
    value: 'vote_average.asc',
  },
];

const movieSpecificOptions: Option[] = [
  {
    label: 'Release Date Descending',
    value: 'primary_release_date.desc',
  },
  {
    label: 'Release Date Ascending',
    value: 'primary_release_date.asc',
  },
  {
    label: 'Title A-Z',
    value: 'title.asc',
  },
  {
    label: 'Title Z-A',
    value: 'title.desc',
  },
];

const tvSpecificOptions: Option[] = [
  {
    label: 'First Aired Descending',
    value: 'first_air_date.desc',
  },
  {
    label: 'First Aired Ascending',
    value: 'first_air_date.asc',
  },
  {
    label: 'Title A-Z',
    value: 'name.asc',
  },
  {
    label: 'Title Z-A',
    value: 'name.desc',
  },
];

export const movieSortOptions: Option[] = [...commonSortOptions, ...movieSpecificOptions];

export const tvSortOptions: Option[] = [...commonSortOptions, ...tvSpecificOptions];
