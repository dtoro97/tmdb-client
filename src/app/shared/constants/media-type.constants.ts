export enum MediaTypeEnum {
  TV = 'tv',
  MOVIE = 'movie',
}

export const MEDIA_TYPE_CONFIG = {
  [MediaTypeEnum.TV]: {
    label: 'TV Shows',
    releaseDateField: 'first_air_date',
    titleField: 'name',
  },
  [MediaTypeEnum.MOVIE]: {
    label: 'Movies',
    releaseDateField: 'primary_release_date',
    titleField: 'title',
  },
} as const;
