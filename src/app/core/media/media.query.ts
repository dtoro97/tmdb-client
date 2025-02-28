import { combineLatest, filter, map, Observable, withLatestFrom } from 'rxjs';
import {
  Cast,
  Credits,
  Episode,
  ExternalIds,
  Image,
  Images,
  MovieDetails,
  Recommendation,
  Season,
  SeasonDetails,
  TvShowDetails,
  Video,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { MediaState, MediaStore } from './media.store';
import { get, sortBy } from 'lodash';

@Injectable({ providedIn: 'root' })
export class MediaQuery extends Query<MediaState> {
  media$: Observable<TvShowDetails | MovieDetails> = this.select(
    (state) => state.media
  ).pipe(filter(Boolean));
  credits$: Observable<Credits> = this.select((state) => state.credits);
  cast$: Observable<Cast[]> = this.credits$.pipe(
    map((credits) => credits.cast)
  );
  videos$: Observable<Video[]> = this.select((state) => state.videos);
  youtubeVideos$: Observable<Video[]> = this.videos$.pipe(
    map((videos) => {
      return videos
        .filter((video: Video) => video.site === 'YouTube')
        .slice(0, 5);
    })
  );
  recommendations$: Observable<Recommendation[]> = this.select(
    (state) => state.recommendations
  );
  socialLinks$: Observable<ExternalIds> = this.select(
    (state) => state.socialLinks
  ).pipe(filter(Boolean));
  images$: Observable<Images> = this.select((state) => state.images).pipe(
    filter(Boolean)
  );
  backdrop$: Observable<string> = this.media$.pipe(
    map((media) => media.backdrop_path)
  );
  hasBackdrop$: Observable<boolean> = this.images$.pipe(
    map((images) => images.backdrops.length > 0)
  );
  backdrops$: Observable<Image[]> = this.images$.pipe(
    map((images) => images.backdrops.slice(0, 20))
  );
  posters$: Observable<Image[]> = this.images$.pipe(
    map((images) => images.posters.slice(0, 20))
  );
  seasons$: Observable<Season[]> = this.select((state) =>
    get(state.media, 'seasons', [])
  );
  seasonDetails$: Observable<SeasonDetails[]> = this.select((state) =>
    sortBy(state.seasons, 'season_number')
  );
  selectedSeason$: Observable<number> = this.select(
    (state) => state.selectedSeason
  );
  seasonEpisodes$: Observable<Episode[]> = combineLatest([
    this.select((state) => state.seasons),
    this.selectedSeason$,
  ]).pipe(
    map(([seasons, selected]) => {
      return (
        seasons.find((season) => season.season_number === selected)?.episodes ||
        []
      );
    })
  );

  seasonEpisodesCount$: Observable<number> = this.seasonEpisodes$.pipe(
    map((episodes) => episodes.length)
  );
  constructor(store: MediaStore) {
    super(store);
  }

  getMediaId(): number {
    return this.store.getValue().media!.id;
  }
}
