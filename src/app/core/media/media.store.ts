import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { MovieCredits200Response } from '../../api/model/movieCredits200Response';
import { MovieDetails200Response } from '../../api/model/movieDetails200Response';
import { MovieExternalIds200Response } from '../../api/model/movieExternalIds200Response';
import { MovieImages200Response } from '../../api/model/movieImages200Response';
import { MovieVideos200ResponseResultsInner } from '../../api/model/movieVideos200ResponseResultsInner';
import { TvSeasonDetails200Response } from '../../api/model/tvSeasonDetails200Response';
import { TvSeriesDetails200Response } from '../../api/model/tvSeriesDetails200Response';
import { TvSeriesExternalIds200Response } from '../../api/model/tvSeriesExternalIds200Response';
import { TvSeriesRecommendations200ResponseResultsInner } from '../../api/model/tvSeriesRecommendations200ResponseResultsInner';

export interface MediaState {
  media: MovieDetails200Response | TvSeriesDetails200Response | undefined;
  credits: MovieCredits200Response;
  videos: MovieVideos200ResponseResultsInner[];
  recommendations: MovieDetails200Response[] | TvSeriesRecommendations200ResponseResultsInner[];
  socialLinks: MovieExternalIds200Response | TvSeriesExternalIds200Response | undefined;
  images: MovieImages200Response | undefined;
  seasons: TvSeasonDetails200Response[];
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
