import { combineLatest, filter, map, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { MovieCredits200Response } from '../../api/model/movieCredits200Response';
import { MovieCredits200ResponseCastInner } from '../../api/model/movieCredits200ResponseCastInner';
import { MovieDetails200Response } from '../../api/model/movieDetails200Response';
import { MovieExternalIds200Response } from '../../api/model/movieExternalIds200Response';
import { MovieImages200Response } from '../../api/model/movieImages200Response';
import { MovieImages200ResponseBackdropsInner } from '../../api/model/movieImages200ResponseBackdropsInner';
import { MovieVideos200ResponseResultsInner } from '../../api/model/movieVideos200ResponseResultsInner';
import { TvSeasonDetails200Response } from '../../api/model/tvSeasonDetails200Response';
import { TvSeasonDetails200ResponseEpisodesInner } from '../../api/model/tvSeasonDetails200ResponseEpisodesInner';
import { TvSeriesDetails200Response } from '../../api/model/tvSeriesDetails200Response';
import { TvSeriesDetails200ResponseSeasonsInner } from '../../api/model/tvSeriesDetails200ResponseSeasonsInner';
import { TvSeriesExternalIds200Response } from '../../api/model/tvSeriesExternalIds200Response';
import { TvSeriesRecommendations200ResponseResultsInner } from '../../api/model/tvSeriesRecommendations200ResponseResultsInner';

import { MediaState, MediaStore } from './media.store';
import { get, sortBy } from 'lodash';

@Injectable({ providedIn: 'root' })
export class MediaQuery extends Query<MediaState> {
  media$: Observable<TvSeriesDetails200Response | MovieDetails200Response> = this.select(
    (state) => state.media,
  ).pipe(filter(Boolean));
  credits$: Observable<MovieCredits200Response> = this.select((state) => state.credits);
  cast$: Observable<MovieCredits200ResponseCastInner[]> = this.credits$.pipe(
    map((credits) => credits.cast || []),
  );
  videos$: Observable<MovieVideos200ResponseResultsInner[]> = this.select((state) => state.videos);
  youtubeVideos$: Observable<MovieVideos200ResponseResultsInner[]> = this.videos$.pipe(
    map((videos) => {
      return videos
        .filter((video: MovieVideos200ResponseResultsInner) => video.site === 'YouTube')
        .slice(0, 5);
    }),
  );
  recommendations$: Observable<MovieDetails200Response[] | TvSeriesRecommendations200ResponseResultsInner[]> =
    this.select((state) => state.recommendations);
  socialLinks$: Observable<MovieExternalIds200Response | TvSeriesExternalIds200Response> = this.select(
    (state) => state.socialLinks,
  ).pipe(filter(Boolean));
  images$: Observable<MovieImages200Response> = this.select((state) => state.images).pipe(
    filter(Boolean),
  );
  backdrop$: Observable<string> = this.media$.pipe(
    map((media) => media.backdrop_path || ''),
  );
  hasBackdrop$: Observable<boolean> = this.images$.pipe(
    map((images) => (images.backdrops || []).length > 0),
  );
  backdrops$: Observable<MovieImages200ResponseBackdropsInner[]> = this.images$.pipe(
    map((images) => (images.backdrops || []).slice(0, 20)),
  );
  posters$: Observable<MovieImages200ResponseBackdropsInner[]> = this.images$.pipe(
    map((images) => (images.posters || []).slice(0, 20)),
  );
  seasons$: Observable<TvSeriesDetails200ResponseSeasonsInner[]> = this.select((state) =>
    get(state.media, 'seasons', []),
  );
  seasonDetails$: Observable<TvSeasonDetails200Response[]> = this.select((state) =>
    sortBy(state.seasons, 'season_number'),
  );
  selectedSeason$: Observable<number> = this.select(
    (state) => state.selectedSeason,
  );
  seasonEpisodes$: Observable<TvSeasonDetails200ResponseEpisodesInner[]> = combineLatest([
    this.select((state) => state.seasons),
    this.selectedSeason$,
  ]).pipe(
    map(([seasons, selected]) => {
      return (
        seasons.find((season) => season.season_number === selected)?.episodes ||
        []
      );
    }),
  );

  seasonEpisodesCount$: Observable<number> = this.seasonEpisodes$.pipe(
    map((episodes) => episodes.length),
  );
  constructor(store: MediaStore) {
    super(store);
  }

  getMediaId(): number {
    return this.store.getValue().media!.id!;
  }
}
