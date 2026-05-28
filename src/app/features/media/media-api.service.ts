import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import {
    AggregateCredits,
    ContentRatingList,
    Credits,
    ImageList,
    Movie,
    MovieRestControllerService,
    ReleaseDateList,
    ReviewPage,
    ReviewDetails,
    ReviewRestControllerService,
    TvSeries,
    TvSeriesRestControllerService,
    WatchProviderList,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { buildImageLanguageFallback, LocaleStoreService, type MediaType } from '../../shared';

@Injectable({ providedIn: 'root' })
export class MediaApiService {
    constructor(
        private readonly movieService: MovieRestControllerService,
        private readonly tvService: TvSeriesRestControllerService,
        private readonly reviewService: ReviewRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {}

    getDetails$(id: number, type: MediaType): Observable<Movie | TvSeries> {
        return type === 'tv'
            ? this.tvService.tvSeriesDetails(id, 'external_ids', undefined, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieDetails(id, 'external_ids', undefined, undefined, undefined, API_JSON_OPTIONS);
    }

    getCredits$(id: number, type: MediaType): Observable<Credits | AggregateCredits> {
        return type === 'tv'
            ? this.tvService.tvSeriesAggregateCredits(id, undefined, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieCredits(id, undefined, undefined, undefined, API_JSON_OPTIONS);
    }

    getSimilar$(id: number, type: MediaType): Observable<{ results?: unknown[] }> {
        return type === 'tv'
            ? this.tvService.tvSeriesSimilar(String(id), undefined, 1, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieSimilar(id, undefined, 1, undefined, undefined, API_JSON_OPTIONS);
    }

    getRecommendations$(id: number, type: MediaType): Observable<{ results?: unknown[] }> {
        return type === 'tv'
            ? this.tvService.tvSeriesRecommendations(id, undefined, 1, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieRecommendations(id, undefined, 1, undefined, undefined, API_JSON_OPTIONS);
    }

    getImages$(id: number, type: MediaType): Observable<ImageList> {
        const language = this.localeStore.language();
        const includeImageLanguage = buildImageLanguageFallback();

        return type === 'tv'
            ? this.tvService.tvSeriesImages(id, includeImageLanguage, language, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieImages(id, includeImageLanguage, language, undefined, undefined, API_JSON_OPTIONS);
    }

    getKeywords$(id: number, type: MediaType): Observable<{ results?: unknown[]; keywords?: unknown[] }> {
        return type === 'tv'
            ? this.tvService.tvSeriesKeywords(id, undefined, undefined, API_JSON_OPTIONS)
            : this.movieService.movieKeywords(String(id), undefined, undefined, API_JSON_OPTIONS);
    }

    getWatchProviders$(id: number, type: MediaType): Observable<WatchProviderList> {
        return type === 'tv'
            ? this.tvService.tvSeriesWatchProviders(id, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieWatchProviders(id, 'body', false, API_JSON_OPTIONS);
    }

    getCertification$(id: number, type: MediaType): Observable<ContentRatingList | ReleaseDateList> {
        return type === 'tv'
            ? this.tvService.tvSeriesContentRatings(id, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieReleaseDates(id, 'body', false, API_JSON_OPTIONS);
    }

    getReviews$(id: number, type: MediaType, page: number): Observable<ReviewPage> {
        return type === 'tv'
            ? this.tvService.tvSeriesReviews(id, undefined, page, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieReviews(id, undefined, page, 'body', false, API_JSON_OPTIONS);
    }

    getReviewDetails$(reviewId: string): Observable<ReviewDetails> {
        return this.reviewService.reviewDetails(reviewId, 'body', false, API_JSON_OPTIONS);
    }
}
