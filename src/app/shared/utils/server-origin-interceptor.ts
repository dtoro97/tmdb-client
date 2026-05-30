import { HttpInterceptorFn } from '@angular/common/http';
import { inject, REQUEST } from '@angular/core';

export const serverOriginInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith('/') || req.url.startsWith('//')) {
        return next(req);
    }

    const request = inject(REQUEST, { optional: true });

    if (!request) {
        return next(req);
    }

    return next(
        req.clone({
            url: new URL(req.url, request.url).toString(),
        }),
    );
};
