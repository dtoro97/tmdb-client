import { HttpInterceptorFn } from '@angular/common/http';
import { inject, REQUEST, REQUEST_CONTEXT } from '@angular/core';

interface CloudflareRequestContext {
    readonly cloudflareEnv?: {
        readonly API_KEY?: string;
        readonly TMDB_API_KEY?: string;
    };
}

const TMDB_API_ORIGIN = 'https://api.themoviedb.org';
const TMDB_PROXY_PREFIX = '/api/tmdb/';
const TMDB_API_VERSIONS = new Set(['3', '4']);

export const serverOriginInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith('/') || req.url.startsWith('//')) {
        return next(req);
    }

    const request = inject(REQUEST, { optional: true });

    if (!request) {
        return next(req);
    }

    const tmdbUrl = toTmdbUrl(req.url, request.url);

    if (tmdbUrl) {
        const requestContext = inject(REQUEST_CONTEXT, {
            optional: true,
        }) as CloudflareRequestContext | null;
        const token = getTmdbApiToken(requestContext);
        const headers =
            token && !req.headers.has('Authorization')
                ? req.headers.set('Authorization', `Bearer ${token}`)
                : req.headers;

        return next(
            req.clone({
                headers,
                url: tmdbUrl,
            }),
        );
    }

    return next(
        req.clone({
            url: new URL(req.url, request.url).toString(),
        }),
    );
};

const toTmdbUrl = (url: string, requestUrl: string): string | null => {
    const proxyUrl = new URL(url, requestUrl);

    if (!proxyUrl.pathname.startsWith(TMDB_PROXY_PREFIX)) {
        return null;
    }

    const proxyPath = proxyUrl.pathname.slice(TMDB_PROXY_PREFIX.length);
    const [version, ...pathSegments] = proxyPath.split('/');

    if (
        !TMDB_API_VERSIONS.has(version) ||
        pathSegments.length === 0 ||
        pathSegments.every((segment) => segment.length === 0)
    ) {
        return null;
    }

    const tmdbUrl = new URL(
        `/${version}/${pathSegments.join('/')}`,
        TMDB_API_ORIGIN,
    );
    tmdbUrl.search = proxyUrl.search;

    return tmdbUrl.toString();
};

const getTmdbApiToken = (
    requestContext: CloudflareRequestContext | null,
): string | null => {
    const token =
        requestContext?.cloudflareEnv?.TMDB_API_KEY ??
        requestContext?.cloudflareEnv?.API_KEY;
    const trimmedToken = token?.trim();

    return trimmedToken ? trimmedToken : null;
};
