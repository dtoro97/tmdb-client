import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IActor,
  ICast,
  IGenreData,
  IResponseList,
  ITvShow,
} from '../interfaces';
import { IMovie } from '../interfaces/movies.interface';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  search(query: string, type: string): Observable<IResponseList> {
    return this.http.get<IResponseList>(
      environment.apiUrl + '/search/' + type,
      {
        params: {
          api_key: environment.apiKey,
          query,
        },
      }
    );
  }

  getMovieGenres(): Observable<IGenreData> {
    return this.http.get<IGenreData>(environment.apiUrl + '/genre/movie/list', {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getTvShowGenres(): Observable<IGenreData> {
    return this.http.get<IGenreData>(environment.apiUrl + '/genre/tv/list', {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getTrending(
    mediaType: string,
    timeWindow = 'day'
  ): Observable<IResponseList> {
    const url = `${environment.apiUrl}/trending/${mediaType}/${timeWindow}`;
    return this.http.get<IResponseList>(url, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getTopRated(mediaType: string, page = 1): Observable<IResponseList> {
    const url = `${environment.apiUrl}/${mediaType}/top_rated`;
    return this.http.get<IResponseList>(url, {
      params: {
        api_key: environment.apiKey,
        page,
      },
    });
  }

  getMoviesByGenre(genreId: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(
      `${environment.apiUrl}/genre/${genreId}/movies`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getTvShowsByGenre(genreId: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(`${environment.apiUrl}/discover/tv`, {
      params: {
        api_key: environment.apiKey,
        with_genres: genreId,
        sort_by: 'popularity.desc',
        page: 1,
      },
    });
  }

  getMovieDetails(id: number): Observable<IMovie> {
    return this.http.get<IMovie>(`${environment.apiUrl}/movie/${id}`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getTvShowDetails(id: number): Observable<ITvShow> {
    return this.http.get<ITvShow>(`${environment.apiUrl}/tv/${id}`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getSimilarMovies(id: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(
      `${environment.apiUrl}/movie/${id}/similar`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getSimilarTvShows(id: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(
      `${environment.apiUrl}/tv/${id}/similar`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getCreditByMovie(id: number): Observable<ICast> {
    return this.http.get<any>(`${environment.apiUrl}/movie/${id}/credits`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getCreditByTvShow(id: number): Observable<ICast> {
    return this.http.get<any>(`${environment.apiUrl}/tv/${id}/credits`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getActorDetails(id: number): Observable<IActor> {
    return this.http.get<IActor>(`${environment.apiUrl}/person/${id}`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getMoviesForActor(id: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(
      `${environment.apiUrl}/discover/movie`,
      {
        params: {
          api_key: environment.apiKey,
          with_cast: id,
          sort_by: 'popularity.desc',
          page: 1,
        },
      }
    );
  }

  getShowsForActor(id: number): Observable<IResponseList> {
    return this.http.get<IResponseList>(`${environment.apiUrl}/discover/tv`, {
      params: {
        api_key: environment.apiKey,
        with_cast: id,
        sort_by: 'popularity.desc',
        page: 1,
      },
    });
  }
}
