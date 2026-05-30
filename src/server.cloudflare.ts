interface AssetBinding {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface CloudflarePagesEnv {
    ASSETS: AssetBinding;
    API_KEY?: string;
    TMDB_API_KEY?: string;
}

const BROWSER_ASSET_PREFIX = '';
const CLIENT_INDEX_PATH = '/index.html';
const NOT_FOUND_STATUS = 404;
const TMDB_API_ORIGIN = 'https://api.themoviedb.org';
const TMDB_PROXY_PREFIX = '/api/tmdb/';
const TMDB_API_VERSIONS = new Set(['3', '4']);
const ALLOWED_TMDB_METHODS = new Set(['DELETE', 'GET', 'POST', 'PUT']);
const STRIPPED_TMDB_REQUEST_HEADERS = [
    'accept-encoding',
    'cf-connecting-ip',
    'cf-ipcountry',
    'cf-ray',
    'cf-visitor',
    'content-length',
    'cookie',
    'host',
    'referer',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-real-ip',
];
const STRIPPED_TMDB_RESPONSE_HEADERS = [
    'access-control-allow-credentials',
    'access-control-allow-headers',
    'access-control-allow-methods',
    'access-control-allow-origin',
    'access-control-expose-headers',
    'access-control-max-age',
    'set-cookie',
];

const isBrowserAssetRequest = (url: URL): boolean =>
    url.pathname.includes('.');

const getTmdbProxyPath = (url: URL): string | null => {
    if (!url.pathname.startsWith(TMDB_PROXY_PREFIX)) {
        return null;
    }

    const proxyPath = url.pathname.slice(TMDB_PROXY_PREFIX.length);
    const [version, ...pathSegments] = proxyPath.split('/');

    if (
        !TMDB_API_VERSIONS.has(version) ||
        pathSegments.length === 0 ||
        pathSegments.every((segment) => segment.length === 0)
    ) {
        return null;
    }

    return `/${version}/${pathSegments.join('/')}`;
};

const jsonResponse = (
    status: number,
    message: string,
    init?: ResponseInit,
): Response =>
    Response.json(
        { message },
        {
            ...init,
            status,
        },
    );

const getTmdbApiToken = (env: CloudflarePagesEnv): string | null => {
    const token = env.TMDB_API_KEY ?? env.API_KEY;
    const trimmedToken = token?.trim();

    return trimmedToken ? trimmedToken : null;
};

const createTmdbProxyHeaders = (
    request: Request,
    tmdbApiToken: string | null,
): Headers | Response => {
    const headers = new Headers(request.headers);

    for (const header of STRIPPED_TMDB_REQUEST_HEADERS) {
        headers.delete(header);
    }

    if (!headers.get('authorization')?.trim()) {
        if (!tmdbApiToken) {
            return jsonResponse(
                500,
                'TMDb API token is not configured for this deployment.',
            );
        }

        headers.set('authorization', `Bearer ${tmdbApiToken}`);
    }

    return headers;
};

const createTmdbProxyResponse = (response: Response): Response => {
    const headers = new Headers(response.headers);

    for (const header of STRIPPED_TMDB_RESPONSE_HEADERS) {
        headers.delete(header);
    }

    return new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
    });
};

const proxyTmdbRequest = (
    request: Request,
    env: CloudflarePagesEnv,
): Promise<Response> | Response => {
    if (request.headers.get('sec-fetch-site') === 'cross-site') {
        return jsonResponse(403, 'Cross-site TMDb proxy requests are not allowed.');
    }

    if (!ALLOWED_TMDB_METHODS.has(request.method)) {
        return jsonResponse(405, 'Method not allowed.', {
            headers: {
                allow: Array.from(ALLOWED_TMDB_METHODS).join(', '),
            },
        });
    }

    const url = new URL(request.url);
    const tmdbPath = getTmdbProxyPath(url);

    if (!tmdbPath) {
        return jsonResponse(404, 'TMDb proxy route not found.');
    }

    const headers = createTmdbProxyHeaders(request, getTmdbApiToken(env));

    if (headers instanceof Response) {
        return headers;
    }

    const tmdbUrl = new URL(tmdbPath, TMDB_API_ORIGIN);
    tmdbUrl.search = url.search;

    return fetch(tmdbUrl.toString(), {
        body:
            request.method === 'GET' || request.method === 'HEAD'
                ? undefined
                : request.body,
        headers,
        method: request.method,
        redirect: 'manual',
    }).then(createTmdbProxyResponse);
};

const createBrowserAssetRequest = (
    request: Request,
    pathname: string,
): Request => {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = `${BROWSER_ASSET_PREFIX}${pathname}`;

    return new Request(assetUrl.toString(), request);
};

const fetchBrowserAsset = async (
    request: Request,
    env: CloudflarePagesEnv,
    pathname = new URL(request.url).pathname,
): Promise<Response> => {
    const response = await env.ASSETS.fetch(
        createBrowserAssetRequest(request, pathname),
    );

    if (response.status !== NOT_FOUND_STATUS || pathname === CLIENT_INDEX_PATH) {
        return response;
    }

    return env.ASSETS.fetch(createBrowserAssetRequest(request, CLIENT_INDEX_PATH));
};

export default {
    async fetch(request: Request, env: CloudflarePagesEnv): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith(TMDB_PROXY_PREFIX)) {
            return proxyTmdbRequest(request, env);
        }

        if (isBrowserAssetRequest(url)) {
            return fetchBrowserAsset(request, env);
        }

        return fetchBrowserAsset(request, env, CLIENT_INDEX_PATH);
    },
};
