import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export const loader = <T>(
  ngxUiLoaderService: NgxUiLoaderService,
  loaderId: string = 'master',
) => {
  return (source: Observable<T>): Observable<T> => {
    ngxUiLoaderService.startLoader(loaderId);

    return source.pipe(
      finalize(() => {
        ngxUiLoaderService.stopLoader(loaderId);
      }),
    );
  };
};
