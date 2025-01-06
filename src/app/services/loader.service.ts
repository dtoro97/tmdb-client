import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  _isLoading: BehaviorSubject<boolean> = new BehaviorSubject(true);
  isLoading$: Observable<boolean> = this._isLoading.asObservable();
  setLoading(isLoading: boolean) {
    this._isLoading.next(isLoading);
  }
}
