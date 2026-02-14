export enum MediaType {
  TV = 'tv',
  MOVIE = 'movie'
}

export const MEDIA_TYPE_CONFIG = {
  [MediaType.TV]: {
    label: 'TV Shows',
    releaseDateField: 'first_air_date',
    titleField: 'name'
  },
  [MediaType.MOVIE]: {
    label: 'Movies',
    releaseDateField: 'primary_release_date',
    titleField: 'title'
  }
} as const;
