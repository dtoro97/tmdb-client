import { Injectable } from '@angular/core';
import {
  Cast,
  Credits,
  Episode,
  ExternalIds,
  Image,
  Images,
  LanguageConfiguration,
  MovieDetails,
  Recommendation,
  Season,
  SeasonDetails,
  TvShowDetails,
  Video,
  WatchProvider,
} from 'tmdb-ts';
import { Region } from 'tmdb-ts/dist/types/regions';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  tap,
} from 'rxjs';
import { MediaTypeEnum } from '../../shared/constants/media-type.constants';
import { loader } from '../../shared/utils/loader';
import { TmdbService } from '../../shared/services/tmdb.service';
import { handleMediaError } from '../../shared/operators/error-handler.operator';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Router } from '@angular/router';
import { get, sortBy } from 'lodash';

export interface MediaState {
  media: MovieDetails | TvShowDetails | undefined;
  credits: Credits;
  videos: Video[];
  recommendations: Recommendation[];
  socialLinks: ExternalIds | undefined;
  images: Images | undefined;
  seasons: SeasonDetails[];
  selectedSeason: number;
  providers: WatchProvider[];
  regions: Region[];
  languages: LanguageConfiguration[];
}

@Injectable({ providedIn: 'root' })
export class MediaStoreService extends ComponentStore<MediaState> {
  media$: Observable<TvShowDetails | MovieDetails> = this.select(
    (state) => state.media,
  ).pipe(filter(Boolean));
  credits$: Observable<Credits> = this.select((state) => state.credits);
  cast$: Observable<Cast[]> = this.credits$.pipe(
    map((credits) => credits.cast),
  );
  videos$: Observable<Video[]> = this.select((state) => state.videos);
  youtubeVideos$: Observable<Video[]> = this.videos$.pipe(
    map((videos) => {
      return videos
        .filter((video: Video) => video.site === 'YouTube')
        .slice(0, 5);
    }),
  );
  recommendations$: Observable<Recommendation[]> = this.select(
    (state) => state.recommendations,
  );
  socialLinks$: Observable<ExternalIds> = this.select(
    (state) => state.socialLinks,
  ).pipe(filter(Boolean));
  images$: Observable<Images> = this.select((state) => state.images).pipe(
    filter(Boolean),
  );
  backdrop$: Observable<string> = this.media$.pipe(
    map((media) => media.backdrop_path),
  );
  hasBackdrop$: Observable<boolean> = this.images$.pipe(
    map((images) => images.backdrops.length > 0),
  );
  backdrops$: Observable<Image[]> = this.images$.pipe(
    map((images) => images.backdrops.slice(0, 20)),
  );
  posters$: Observable<Image[]> = this.images$.pipe(
    map((images) => images.posters.slice(0, 20)),
  );
  seasons$: Observable<Season[]> = this.select((state) =>
    get(state.media, 'seasons', []),
  );
  seasonDetails$: Observable<SeasonDetails[]> = this.select((state) =>
    sortBy(state.seasons, 'season_number'),
  );
  selectedSeason$: Observable<number> = this.select(
    (state) => state.selectedSeason,
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
    }),
  );
  seasonEpisodesCount$: Observable<number> = this.seasonEpisodes$.pipe(
    map((episodes) => episodes.length),
  );

  languages$: Observable<LanguageConfiguration[]> = this.select(
    (state) => state.languages,
  );

  constructor(
    private router: Router,
    private tmdbService: TmdbService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {
    super({
      media: undefined,
      credits: { id: 0, cast: [], crew: [] },
      videos: [],
      recommendations: [],
      socialLinks: undefined,
      images: undefined,
      seasons: [],
      selectedSeason: 1,
      providers: [],
      regions: [],
      languages: [],
    });
    forkJoin({
      providers: from(this.tmdbService.watchProviders.getTvProviders()),
      regions: from(this.tmdbService.watchProviders.getRegions()),
      languages: from(this.tmdbService.configuration.getLanguages()),
    }).subscribe(({ providers, regions, languages }) => {
      this.patchState({
        providers: providers.results,
        regions: regions.results,
        languages,
      });
    });
  }

  fetchMediaDetails(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.details(id)
        : this.tmdbService.movies.details(id),
    ).pipe(
      handleMediaError(this.router),
      tap((data) => {
        this.patchState({ media: data as any });
        if (
          type === MediaTypeEnum.TV &&
          (data as TvShowDetails).seasons.length
        ) {
          this.updateSelectedSeason(1);
        }
      }),
    );
  }

  fetchCredits(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.credits(id)
        : this.tmdbService.movies.credits(id),
    ).pipe(tap((data) => this.patchState({ credits: data })));
  }

  fetchVideos(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.videos(id)
        : this.tmdbService.movies.videos(id),
    ).pipe(tap((data) => this.patchState({ videos: data.results })));
  }

  fetchRecommendations(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.recommendations(id)
        : this.tmdbService.movies.recommendations(id),
    ).pipe(tap((data) => this.patchState({ recommendations: data.results })));
  }

  fetchSocialLinks(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.externalIds(id)
        : this.tmdbService.movies.externalIds(id),
    ).pipe(tap((data) => this.patchState({ socialLinks: data })));
  }

  fetchImages(id: number, type: string) {
    return from(
      type === MediaTypeEnum.TV
        ? this.tmdbService.tvShows.images(id)
        : this.tmdbService.movies.images(id),
    ).pipe(tap((data) => this.patchState({ images: data })));
  }

  fetchSeason(tvShowID: number, seasonNumber: number) {
    const seasons = this.get().seasons;
    return from(
      this.tmdbService.tvSeasons.details({ tvShowID, seasonNumber }),
    ).pipe(
      loader(this.ngxUiLoaderService, 'master'),
      tap((data) => {
        this.patchState({ seasons: [...seasons, data] });
      }),
    );
  }

  updateSelectedSeason(selectedSeason: number) {
    const seasons = this.get().seasons;
    if (!seasons.find((season) => season.season_number === selectedSeason)) {
      this.fetchSeason(this.get().media!.id, selectedSeason).subscribe();
    }
    this.patchState({ selectedSeason });
  }

  updateSeasons(seasons: SeasonDetails[]) {
    this.patchState({ seasons });
  }
}
