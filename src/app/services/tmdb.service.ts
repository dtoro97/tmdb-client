import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { TMDB } from 'tmdb-ts';

@Injectable({
  providedIn: 'root',
})
export class TmdbService extends TMDB {
  constructor() {
    super(environment.apiKey);
  }
}
