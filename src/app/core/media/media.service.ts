import { catchError, EMPTY, from, tap } from 'rxjs';
import { SeasonDetails, TvShowDetails } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { TmdbService } from '../../shared';
import { StateService } from '../state';
import { MediaStore } from './media.store';

@Injectable({ providedIn: 'root' })
export class MediaService {
  constructor(
    private store: MediaStore,
    private tmdbService: TmdbService,
    private router: Router,
    private state: StateService
  ) {}

  fetchMediaDetails(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.details(id)
        : this.tmdbService.movies.details(id)
    ).pipe(
      catchError((e) => {
        this.router.navigate(['not-found']);
        return EMPTY;
      }),
      tap((data) => {
        this.store.update({ media: data });
        if (type === 'tv' && (data as TvShowDetails).seasons.length) {
          this.updateSelectedSeason(1);
        }
      })
    );
  }

  fetchCredits(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.credits(id)
        : this.tmdbService.movies.credits(id)
    ).pipe(tap((data) => this.store.update({ credits: data })));
  }

  fetchVideos(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.videos(id)
        : this.tmdbService.movies.videos(id)
    ).pipe(tap((data) => this.store.update({ videos: data.results })));
  }

  fetchRecommendations(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.recommendations(id)
        : this.tmdbService.movies.recommendations(id)
    ).pipe(tap((data) => this.store.update({ recommendations: data.results })));
  }

  fetchSocialLinks(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.externalIds(id)
        : this.tmdbService.movies.externalIds(id)
    ).pipe(tap((data) => this.store.update({ socialLinks: data })));
  }

  fetchImages(id: number, type: string) {
    return from(
      type === 'tv'
        ? this.tmdbService.tvShows.images(id)
        : this.tmdbService.movies.images(id)
    ).pipe(tap((data) => this.store.update({ images: data })));
  }

  fetchSeason(tvShowID: number, seasonNumber: number) {
    this.state.setLoading(true);
    const seasons = this.store.getValue().seasons;
    return from(
      this.tmdbService.tvSeasons.details({ tvShowID, seasonNumber })
    ).pipe(
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
        this.store.getValue().media!.id,
        selectedSeason
      ).subscribe();
    }
    this.store.update({ selectedSeason });
  }

  updateSeasons(seasons: SeasonDetails[]) {
    this.store.update({ seasons });
  }
}
