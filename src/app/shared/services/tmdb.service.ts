import { Injectable } from '@angular/core';
import { TMDB } from 'tmdb-ts';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TmdbService extends TMDB {
  constructor() {
    super(environment.apiKey);
  }
}
