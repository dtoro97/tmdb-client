export interface IMovieDetails {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: IBelongsToCollection;
  budget: number;
  genres?: IGenresEntity[] | null;
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies?: IProductionCompaniesEntity[] | null;
  production_countries?: IProductionCountriesEntity[] | null;
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
interface IGenresEntity {
  id: number;
  name: string;
}
export interface IProductionCompaniesEntity {
  id: number;
  logo_path?: string | null;
  name: string;
  origin_country: string;
}
interface IProductionCountriesEntity {
  iso_3166_1: string;
  name: string;
}
interface ISpokenLanguagesEntity {
  english_name: string;
  iso_639_1: string;
  name: string;
}
