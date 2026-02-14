import { from, tap } from 'rxjs';
import { SeasonDetails, TvShowDetails } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { MediaType, TmdbService, spinner } from '../../shared';
import { handleMediaError } from '../../shared/operators/error-handler.operator';
import { MediaStore } from './media.store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({ providedIn: 'root' })
export class MediaService {
  constructor(
    private store: MediaStore,
    private tmdbService: TmdbService,
    private router: Router,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {}

  fetchMediaDetails(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.details(id)
        : this.tmdbService.movies.details(id),
    ).pipe(
      handleMediaError(this.router),
      tap((data) => {
        this.store.update({ media: data as any });
        if (type === MediaType.TV && (data as TvShowDetails).seasons.length) {
          this.updateSelectedSeason(1);
        }
      }),
    );
  }

  fetchCredits(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.credits(id)
        : this.tmdbService.movies.credits(id),
    ).pipe(tap((data) => this.store.update({ credits: data })));
  }

  fetchVideos(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.videos(id)
        : this.tmdbService.movies.videos(id),
    ).pipe(tap((data) => this.store.update({ videos: data.results })));
  }

  fetchRecommendations(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.recommendations(id)
        : this.tmdbService.movies.recommendations(id),
    ).pipe(tap((data) => this.store.update({ recommendations: data.results })));
  }

  fetchSocialLinks(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.externalIds(id)
        : this.tmdbService.movies.externalIds(id),
    ).pipe(tap((data) => this.store.update({ socialLinks: data })));
  }

  fetchImages(id: number, type: string) {
    return from(
      type === MediaType.TV
        ? this.tmdbService.tvShows.images(id)
        : this.tmdbService.movies.images(id),
    ).pipe(tap((data) => this.store.update({ images: data })));
  }

  fetchSeason(tvShowID: number, seasonNumber: number) {
    const seasons = this.store.getValue().seasons;
    return from(
      this.tmdbService.tvSeasons.details({ tvShowID, seasonNumber }),
    ).pipe(
      spinner(this.ngxUiLoaderService, 'master'),
      tap((data) => {
        this.store.update({ seasons: [...seasons, data] });
      }),
    );
  }

  updateSelectedSeason(selectedSeason: number) {
    const seasons = this.store.getValue().seasons;
    if (!seasons.find((season) => season.season_number === selectedSeason)) {
      this.fetchSeason(
        this.store.getValue().media!.id,
        selectedSeason,
      ).subscribe();
    }
    this.store.update({ selectedSeason });
  }

  updateSeasons(seasons: SeasonDetails[]) {
    this.store.update({ seasons });
  }
}
