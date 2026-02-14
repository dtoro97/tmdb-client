import { Genre } from 'tmdb-ts';

export interface SelectableGenre extends Genre {
  selected: boolean;
}
