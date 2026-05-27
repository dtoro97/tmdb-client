import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocaleStoreService } from '../services/locale-store.service';
import { environment } from '../../../environments/environment';

const TMDB_BASE = environment.apiUrl;
const EXCLUDED_URLS = ['/images', '/videos'];

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith(TMDB_BASE) || EXCLUDED_URLS.some((excl) => req.url.includes(excl))) {
        return next(req);
    }

    const localeStore = inject(LocaleStoreService);
    let params = req.params;

    if (!params.has('language')) {
        params = params.set('language', localeStore.language());
    }

    if (!params.has('region')) {
        params = params.set('region', localeStore.region());
    }

    return next(req.clone({ params }));
};
