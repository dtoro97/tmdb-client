import { IGenre } from './genre.interface';
import { IProductionCompany } from './production-company.interface';
import { IProductionCountry } from './production-country.interface';

export interface IMovie {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: IBelongsToCollection;
  budget: number;
  genres?: IGenre[] | null;
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies?: IProductionCompany[] | null;
  production_countries?: IProductionCountry[] | null;
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages?: ISpokenLanguagesEntity[] | null;
  status: string;
  tagline: string;
  title: string;
  name?: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}
export interface IBelongsToCollection {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path?: null;
}
export interface ISpokenLanguagesEntity {
  english_name: string;
  iso_639_1: string;
  name: string;
}
