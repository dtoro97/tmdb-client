import { catchError, EMPTY, Observable, tap } from 'rxjs';
import { TvSeriesDetails200Response } from '../../api/model/tvSeriesDetails200Response';
import { TvSeasonDetails200Response } from '../../api/model/tvSeasonDetails200Response';
import { MovieDetails200Response } from '../../api/model/movieDetails200Response';
import { MovieCredits200Response } from '../../api/model/movieCredits200Response';
import { MovieImages200Response } from '../../api/model/movieImages200Response';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { TmdbRestControllerService } from '../../api/api/tmdb.service';
import { StateService } from '../state';
import { MediaStore } from './media.store';

@Injectable({ providedIn: 'root' })
export class MediaService {
  constructor(
    private store: MediaStore,
    private tmdbApi: TmdbRestControllerService,
    private router: Router,
    private state: StateService
  ) {}

  fetchMediaDetails(id: number, type: string) {
    const request$: Observable<MovieDetails200Response | TvSeriesDetails200Response> =
      type === 'tv'
        ? this.tmdbApi.tvSeriesDetails(id)
        : this.tmdbApi.movieDetails(id);

    return request$.pipe(
      catchError((e) => {
        this.router.navigate(['not-found']);
        return EMPTY;
      }),
      tap((data) => {
        this.store.update({ media: data });
        if (type === 'tv' && ((data as TvSeriesDetails200Response).seasons || []).length) {
          this.updateSelectedSeason(1);
        }
      })
    );
  }

  fetchCredits(id: number, type: string) {
    const request$: Observable<MovieCredits200Response> =
      type === 'tv'
        ? this.tmdbApi.tvSeriesCredits(id) as Observable<MovieCredits200Response>
        : this.tmdbApi.movieCredits(id);

    return request$.pipe(tap((data) => this.store.update({ credits: data })));
  }

  fetchVideos(id: number, type: string) {
    return (
      type === 'tv'
        ? this.tmdbApi.tvSeriesVideos(id)
        : this.tmdbApi.movieVideos(id)
    ).pipe(tap((data) => this.store.update({ videos: data.results || [] })));
  }

  fetchRecommendations(id: number, type: string) {
    return (
      type === 'tv'
        ? this.tmdbApi.tvSeriesRecommendations(id)
        : this.tmdbApi.movieRecommendations(id)
    ).pipe(tap((data: any) => this.store.update({ recommendations: data.results || [] })));
  }

  fetchSocialLinks(id: number, type: string) {
    return (
      type === 'tv'
        ? this.tmdbApi.tvSeriesExternalIds(id)
        : this.tmdbApi.movieExternalIds(id)
    ).pipe(tap((data) => this.store.update({ socialLinks: data })));
  }

  fetchImages(id: number, type: string) {
    const request$: Observable<MovieImages200Response> =
      type === 'tv'
        ? this.tmdbApi.tvSeriesImages(id)
        : this.tmdbApi.movieImages(id);

    return request$.pipe(tap((data) => this.store.update({ images: data })));
  }

  fetchSeason(tvShowID: number, seasonNumber: number) {
    this.state.setLoading(true);
    const seasons = this.store.getValue().seasons;
    return this.tmdbApi.tvSeasonDetails(tvShowID, seasonNumber).pipe(
      tap((data) => {
        this.state.setLoading(false);
        this.store.update({ seasons: [...seasons, data] });
      })
    );
  }

  updateSelectedSeason(selectedSeason: number) {
    const seasons = this.store.getValue().seasons;
    if (!seasons.find((season) => season.season_number === selectedSeason)) {
      this.fetchSeason(
        this.store.getValue().media!.id!,
        selectedSeason
      ).subscribe();
    }
    this.store.update({ selectedSeason });
  }

  updateSeasons(seasons: TvSeasonDetails200Response[]) {
    this.store.update({ seasons });
  }
}
