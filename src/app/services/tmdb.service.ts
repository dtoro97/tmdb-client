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

  public getTrending(
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

  public getPopular(mediaType: string): Observable<ResponseDataModel> {
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
}
