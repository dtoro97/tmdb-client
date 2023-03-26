import { IGenre } from './genre.interface';
import { IProductionCompany } from './production-company.interface';
import { IProductionCountry } from './production-country.interface';

export interface ITvShow {
  backdrop_path: string;
  created_by?: ICreatedByEntity[] | null;
  episode_run_time?: number[] | null;
  first_air_date: string;
  genres?: IGenre[] | null;
  homepage: string;
  id: number;
  in_production: boolean;
  languages?: string[] | null;
  last_air_date: string;
  last_episode_to_air: ILastEpisodeToAir;
  name: string;
  next_episode_to_air: INextEpisodeToAir;
  networks?: IProductionCompany[] | null;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country?: string[] | null;
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies?: IProductionCompany[] | null;
  production_countries?: IProductionCountry[] | null;
  seasons?: ISeasonsEntity[] | null;
  spoken_languages?: IProductionCountry[] | null;
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
}
export interface ICreatedByEntity {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string;
}
export interface ILastEpisodeToAir {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  season_number: number;
  still_path: string;
  vote_average: number;
  vote_count: number;
}
export interface INextEpisodeToAir {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  season_number: number;
  still_path?: null;
  vote_average: number;
  vote_count: number;
}
export interface ISeasonsEntity {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}
