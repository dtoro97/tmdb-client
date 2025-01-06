export interface TvDetails {
  backdrop_path: string;
  created_by?: ICreatedByEntity[] | null;
  episode_run_time?: number[] | null;
  first_air_date: string;
  genres?: IGenresEntity[] | null;
  homepage: string;
  id: number;
  in_production: boolean;
  languages?: string[] | null;
  last_air_date: string;
  last_episode_to_air: ILastEpisodeToAir;
  name: string;
  next_episode_to_air: INextEpisodeToAir;
  networks?: INetworksEntityOrProductionCompaniesEntity[] | null;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country?: string[] | null;
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies?: INetworksEntityOrProductionCompaniesEntity[] | null;
  production_countries?: IProductionCountriesEntity[] | null;
  seasons?: ISeasonsEntity[] | null;
  spoken_languages?: ISpokenLanguagesEntity[] | null;
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
export interface IGenresEntity {
  id: number;
  name: string;
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
export interface INetworksEntityOrProductionCompaniesEntity {
  name: string;
  id: number;
  logo_path: string;
  origin_country: string;
}
export interface IProductionCountriesEntity {
  iso_3166_1: string;
  name: string;
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
export interface ISpokenLanguagesEntity {
  english_name: string;
  iso_639_1: string;
  name: string;
}
