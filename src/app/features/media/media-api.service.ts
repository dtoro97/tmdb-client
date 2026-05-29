import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import {
    AggregateCredits,
    CollectionDetails,
    CollectionRestControllerService,
    ContentRatingList,
    Credits,
    ImageList,
    KeywordList,
    Movie,
    MoviePage,
    MovieRestControllerService,
    ReleaseDateList,
    ReviewDetails,
    ReviewPage,
    ReviewRestControllerService,
    TvKeywordList,
    TvSeries,
    TvSeriesPage,
    TvSeriesRestControllerService,
    VideoList,
    WatchProviderList,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { type MediaTarget } from './media-target';

@Injectable({ providedIn: 'root' })
export class MediaApiService {
    constructor(
        private readonly collectionService: CollectionRestControllerService,
        private readonly movieService: MovieRestControllerService,
        private readonly reviewService: ReviewRestControllerService,
        private readonly tvService: TvSeriesRestControllerService,
    ) {}

    getDetails$(target: MediaTarget): Observable<Movie | TvSeries> {
        return this.getDetailsWithAppend$(target, 'external_ids');
    }

    getDetailsWithAppend$(target: MediaTarget, appendToResponse: string): Observable<Movie | TvSeries> {
        return this.getDetailsRequest$(target, appendToResponse);
    }

    getMovieCredits$(mediaId: number): Observable<Credits> {
        return this.movieService.movieCredits(mediaId, undefined, 'body', false, API_JSON_OPTIONS);
    }

    getTvCredits$(seriesId: number): Observable<AggregateCredits> {
        return this.tvService.tvSeriesAggregateCredits(seriesId, undefined, 'body', false, API_JSON_OPTIONS);
    }

    getRecommendations$(target: MediaTarget): Observable<MoviePage | TvSeriesPage> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesRecommendations(target.id, undefined, 1, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieRecommendations(target.id, undefined, 1, 'body', false, API_JSON_OPTIONS);
    }

    getSimilar$(target: MediaTarget): Observable<MoviePage | TvSeriesPage> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesSimilar(String(target.id), undefined, 1, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieSimilar(target.id, undefined, 1, 'body', false, API_JSON_OPTIONS);
    }

    getKeywords$(target: MediaTarget): Observable<KeywordList | TvKeywordList> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesKeywords(target.id, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieKeywords(String(target.id), 'body', false, API_JSON_OPTIONS);
    }

    getWatchProviders$(target: MediaTarget): Observable<WatchProviderList> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesWatchProviders(target.id, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieWatchProviders(target.id, 'body', false, API_JSON_OPTIONS);
    }

    getMovieReleaseDates$(mediaId: number): Observable<ReleaseDateList> {
        return this.movieService.movieReleaseDates(mediaId, 'body', false, API_JSON_OPTIONS);
    }

    getTvContentRatings$(seriesId: number): Observable<ContentRatingList> {
        return this.tvService.tvSeriesContentRatings(seriesId, 'body', false, API_JSON_OPTIONS);
    }

    getCollectionDetails$(collectionId: number): Observable<CollectionDetails> {
        return this.collectionService.collectionDetails(collectionId, undefined, undefined, undefined, API_JSON_OPTIONS);
    }

    getImages$(target: MediaTarget, includeImageLanguage: string, language: string): Observable<ImageList> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesImages(
                  target.id,
                  includeImageLanguage,
                  language,
                  'body',
                  false,
                  API_JSON_OPTIONS,
              )
            : this.movieService.movieImages(
                  target.id,
                  includeImageLanguage,
                  language,
                  'body',
                  false,
                  API_JSON_OPTIONS,
              );
    }

    getVideos$(target: MediaTarget): Observable<VideoList> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesVideos(
                  target.id,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  API_JSON_OPTIONS,
              )
            : this.movieService.movieVideos(target.id, undefined, undefined, undefined, API_JSON_OPTIONS);
    }

    getReviews$(target: MediaTarget, page: number): Observable<ReviewPage> {
        return target.type === 'tv'
            ? this.tvService.tvSeriesReviews(target.id, undefined, page, 'body', false, API_JSON_OPTIONS)
            : this.movieService.movieReviews(target.id, undefined, page, 'body', false, API_JSON_OPTIONS);
    }

    getReviewDetails$(reviewId: string): Observable<ReviewDetails> {
        return this.reviewService.reviewDetails(reviewId, 'body', false, API_JSON_OPTIONS);
    }

    private getDetailsRequest$(target: MediaTarget, appendToResponse?: string): Observable<Movie | TvSeries> {
        if (target.type === 'tv') {
            return this.tvService.tvSeriesDetails(
                target.id,
                appendToResponse,
                undefined,
                undefined,
                undefined,
                'body',
                false,
                API_JSON_OPTIONS,
            );
        }

        return this.movieService.movieDetails(
            target.id,
            appendToResponse,
            undefined,
            undefined,
            undefined,
            'body',
            false,
            API_JSON_OPTIONS,
        );
    }
}
