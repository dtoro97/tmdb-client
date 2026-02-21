import { Genre } from 'tmdb-ts';

export interface IGenre extends Genre {
  selected: boolean;
}
