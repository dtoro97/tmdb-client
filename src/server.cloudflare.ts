import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

interface AssetBinding {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface CloudflarePagesEnv {
    ASSETS: AssetBinding;
}

const BROWSER_ASSET_PREFIX = '/browser';
const CLIENT_INDEX_PATH = '/index.csr.html';
const NOT_FOUND_STATUS = 404;

const angularApps = new Map<string, AngularAppEngine>();

const getAngularApp = (request: Request): AngularAppEngine => {
    const hostname = new URL(request.url).hostname;
    const existingApp = angularApps.get(hostname);

    if (existingApp) {
        return existingApp;
    }

    const angularApp = new AngularAppEngine({
        allowedHosts: [hostname],
    });

    angularApps.set(hostname, angularApp);

    return angularApp;
};

const renderAngular = createRequestHandler((request: Request) =>
    getAngularApp(request).handle(request),
);

const isBrowserAssetRequest = (url: URL): boolean =>
    url.pathname.includes('.');

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

export const reqHandler = renderAngular;

export default {
    async fetch(request: Request, env: CloudflarePagesEnv): Promise<Response> {
        const url = new URL(request.url);

        if (isBrowserAssetRequest(url)) {
            return fetchBrowserAsset(request, env);
        }

        const response = await renderAngular(request);

        return response ?? fetchBrowserAsset(request, env, CLIENT_INDEX_PATH);
    },
};
