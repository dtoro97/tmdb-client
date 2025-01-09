import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseDataModel } from '../interfaces';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  constructor(private http: HttpClient) {}

  getTrending(
    mediaType: string,
    timeWindow = 'day'
  ): Observable<ResponseDataModel> {
    return this.http.get<ResponseDataModel>(
      `${environment.apiUrl}/trending/${mediaType}/${timeWindow}`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getPopular(mediaType: string): Observable<ResponseDataModel> {
    return this.http.get<ResponseDataModel>(
      `${environment.apiUrl}/${mediaType}/popular`,
      {
        params: {
          api_key: environment.apiKey,
          include_video: true,
        },
      }
    );
  }

  getUpcomingMovies(): Observable<ResponseDataModel> {
    return this.http.get<ResponseDataModel>(
      `${environment.apiUrl}/movie/upcoming`,
      {
        params: {
          api_key: environment.apiKey,
          page: 1,
        },
      }
    );
  }

  search(mediaType: string, query: string): Observable<ResponseDataModel> {
    return this.http.get<ResponseDataModel>(
      `${environment.apiUrl}/search/${mediaType}`,
      {
        params: {
          api_key: environment.apiKey,
          page: 1,
          query,
        },
      }
    );
  }

  getGenres(mediaType: string): Observable<any> {
    return this.http.get<ResponseDataModel>(
      `${environment.apiUrl}/genre/${mediaType}/list`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getAvailableRegions(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/watch/providers/regions`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getProviders(mediaType: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/watch/providers/${mediaType}`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getMediaDetails(mediaType: string, id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/${mediaType}/${id}`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getLanguages(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/configuration/languages`, {
      params: {
        api_key: environment.apiKey,
      },
    });
  }

  getCredits(id: number, mediaType: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/${mediaType}/${id}/credits`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getVideos(id: number, mediaType: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/${mediaType}/${id}/videos`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }

  getRecommendations(id: number, mediaType: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/${mediaType}/${id}/recommendations`,
      {
        params: {
          api_key: environment.apiKey,
        },
      }
    );
  }
}
