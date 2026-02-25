import { NgxUiLoaderService } from 'ngx-ui-loader';
import { finalize, Observable } from 'rxjs';

export function loader(ngxLoader: NgxUiLoaderService, loaderId = 'master') {
    return function <T>(source: Observable<T>) {
        ngxLoader.startLoader(loaderId);
        return source.pipe(finalize(() => ngxLoader.stopLoader(loaderId)));
    };
}
