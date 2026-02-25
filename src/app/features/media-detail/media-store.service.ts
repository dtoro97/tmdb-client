import { get } from 'lodash';
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  forkJoin,
  iif,
  map,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import {
  CastMember,
  Credits,
  ExternalIds,
  Image,
  ImageList,
  Movie,
  MovieRestControllerService,
  TvSeason,
  TvSeries,
  TvSeasonRestControllerService,
  TvSeriesRestControllerService,
  Video,
} from '../../api';
import { getParam, isDefined, loader } from '../../shared';

export interface MediaState {
  media?: Movie | TvSeries;
  credits: Credits;
  videos: Video[];
  recommendations: any[];
  socialLinks?: ExternalIds;
  images?: ImageList;
  seasons: TvSeason[];
  selectedSeason: number;
  type: string;
}

@Injectable()
export class MediaStoreService extends ComponentStore<MediaState> {
  media$ = this.select((state) => state.media as any).pipe(filter(Boolean));
  credits$ = this.select((state) => state.credits);
  cast$: Observable<CastMember[]> = this.credits$.pipe(
    map((credits) => credits.cast ?? []),
  );
  videos$ = this.select((state) => state.videos);
  youtubeVideos$ = this.videos$.pipe(
    map((videos) => videos.filter((v) => v.site === 'YouTube').slice(0, 5)),
  );
  recommendations$ = this.select((state) => state.recommendations);
  socialLinks$ = this.select((state) => state.socialLinks).pipe(
    filter(Boolean),
  );
  images$ = this.select((state) => state.images).pipe(filter(Boolean));
  backdrop$ = this.media$.pipe(map((media) => (media as any).backdrop_path));
  hasBackdrop$ = this.images$.pipe(
    map((images) => (images.backdrops?.length ?? 0) > 0),
  );
  backdrops$: Observable<Image[]> = this.images$.pipe(
    map((images) => (images.backdrops ?? []).slice(0, 20)),
  );
  posters$: Observable<Image[]> = this.images$.pipe(
    map((images) => (images.posters ?? []).slice(0, 20)),
  );
  seasons$ = this.select((state) => get(state.media, 'seasons', []));
  selectedSeason$ = this.select((state) => state.selectedSeason);
  seasonEpisodes$ = combineLatest([
    this.select((state) => state.seasons),
    this.selectedSeason$,
  ]).pipe(
    map(
      ([seasons, selected]) =>
        seasons.find((s) => s.season_number === selected)?.episodes ?? [],
    ),
  );
  seasonEpisodesCount$ = this.seasonEpisodes$.pipe(
    map((episodes) => episodes.length),
  );
  idAndType$ = this.select((state) => ({
    id: state.media?.id,
    type: state.type,
  })).pipe(
    filter(
      (state): state is { id: number; type: typeof state.type } =>
        isDefined(state.id) && isDefined(state.type),
    ),
  );
  mediaIfTvSeries$ = this.select((state) => ({
    media: state.media,
    type: state.type,
  })).pipe(
    filter(
      (state): state is { media: TvSeries; type: typeof state.type } =>
        isDefined(state.media) && isDefined(state.type) && state.type === 'tv',
    ),
    map((params) => params.media),
  );
  type$ = this.select((state) => state.type);

  constructor(
    private movieRestControllerService: MovieRestControllerService,
    private tvSeriesRestControllerService: TvSeriesRestControllerService,
    private tvSeasonRestControllerService: TvSeasonRestControllerService,
    private ngxUiLoaderService: NgxUiLoaderService,
    private router: Router,
  ) {
    super({
      credits: { id: 0, cast: [], crew: [] },
      videos: [],
      recommendations: [],
      seasons: [],
      selectedSeason: 1,
      type: getParam('type')!,
    });
  }

  updateSelectedSeason(seasonNumber: number): void {
    this.patchState({ selectedSeason: seasonNumber });
  }

  getDetails$(id: number, type: string) {
    return combineLatest([
      this.getDetailsRequest$(id, type).pipe(
        catchError(() => {
          this.router.navigate(['not-found']);
          return EMPTY;
        }),
        tap((data) => {
          this.patchState({ media: data });
        }),
      ),
      iif(
        () => type === 'tv',
        this.mediaIfTvSeries$.pipe(
          take(1),
          switchMap((tvSeries) => this.getSeasons(tvSeries)),
          tap((seasons) => this.patchState({ seasons })),
        ),
        EMPTY,
      ),
      this.creditsRequest(id, type).pipe(
        tap((data) => this.patchState({ credits: data })),
      ),
      this.videosRequest(id, type).pipe(
        tap((data) => this.patchState({ videos: data.results ?? [] })),
      ),
      this.recommendationsRequest(id, type).pipe(
        tap((data) => this.patchState({ recommendations: data.results ?? [] })),
      ),
      this.socialLinksRequest(id, type).pipe(
        tap((data) => this.patchState({ socialLinks: data })),
      ),
      this.imagesRequest(id, type).pipe(
        tap((data) => this.patchState({ images: data })),
      ),
    ]).pipe(loader(this.ngxUiLoaderService));
  }

  private getSeasons(tvSeries: TvSeries) {
    const seasons$ = forkJoin(
      (tvSeries.seasons || []).map((season) =>
        this.getSeason$(tvSeries.id!, season.season_number!),
      ),
    );
    return seasons$;
  }
  private getSeason$(seriesId: number, seasonNumber: number) {
    return this.tvSeasonRestControllerService.tvSeasonDetails(
      seriesId,
      seasonNumber,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        httpHeaderAccept: 'application/json',
      },
    );
  }

  private getDetailsRequest$(
    id: number,
    type: string,
  ): Observable<Movie | TvSeries> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesDetails(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieDetails(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }

  private creditsRequest(id: number, type: string): Observable<Credits> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesCredits(
        id,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieCredits(
        id,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }

  private videosRequest(id: number, type: string): Observable<any> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesVideos(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieVideos(
        id,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }

  private recommendationsRequest(id: number, type: string): Observable<any> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesRecommendations(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieRecommendations(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }

  private socialLinksRequest(id: number, type: string): Observable<any> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesExternalIds(
        id,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieExternalIds(
        id,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }

  private imagesRequest(id: number, type: string): Observable<ImageList> {
    return iif(
      () => type === 'tv',
      this.tvSeriesRestControllerService.tvSeriesImages(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
      this.movieRestControllerService.movieImages(
        id,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          httpHeaderAccept: 'application/json',
        },
      ),
    );
  }
}
