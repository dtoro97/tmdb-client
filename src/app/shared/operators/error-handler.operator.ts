import { Router } from '@angular/router';
import { catchError, EMPTY, MonoTypeOperatorFunction } from 'rxjs';

export function handleMediaError<T>(router: Router): MonoTypeOperatorFunction<T> {
  return catchError((error) => {
    router.navigate(['not-found']);
    return EMPTY;
  });
}
