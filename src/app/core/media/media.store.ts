import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import {
  Credits,
  ExternalIds,
  Images,
  MovieDetails,
  Recommendation,
  Season,
  SeasonDetails,
  TvRecommendation,
  TvShowDetails,
  Video,
} from 'tmdb-ts';

export interface MediaState {
  media: MovieDetails | TvShowDetails | undefined;
  credits: Credits;
  videos: Video[];
  recommendations: Recommendation[] | TvRecommendation[];
  socialLinks: ExternalIds | undefined;
  images: Images | undefined;
  seasons: SeasonDetails[];
  selectedSeason: number;
}

function createInitialState(): MediaState {
  return {
    media: undefined,
    credits: {
      id: 0,
      cast: [],
      crew: [],
    },
    videos: [],
    recommendations: [],
    socialLinks: undefined,
    images: undefined,
    seasons: [],
    selectedSeason: 1,
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'media' })
export class MediaStore extends Store<MediaState> {
  constructor() {
    super(createInitialState());
  }
}
