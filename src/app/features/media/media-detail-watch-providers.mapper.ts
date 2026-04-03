import { WatchProviderItem, WatchProviderList } from '../../api';

import { MediaDetailProviderPreview } from './media-detail.models';

const HERO_PROVIDER_PREVIEW_COUNT = 3;

export interface WatchProviderCategories {
    flatrate: WatchProviderItem[];
    rent: WatchProviderItem[];
    buy: WatchProviderItem[];
    link?: string;
    region: string;
}

const normalizeProviderItems = (
    providers?: WatchProviderItem[],
): WatchProviderItem[] => {
    const seen = new Set<number>();

    return [...(providers ?? [])]
        .filter(
            (provider): provider is WatchProviderItem =>
                !!provider.provider_id &&
                !!provider.provider_name &&
                !!provider.logo_path,
        )
        .sort(
            (a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999),
        )
        .filter((provider) => {
            if (seen.has(provider.provider_id!)) {
                return false;
            }

            seen.add(provider.provider_id!);
            return true;
        });
};

export const pickWatchProviderCategories = (
    providers: WatchProviderList | null | undefined,
    country: string,
): WatchProviderCategories | null => {
    const results = providers?.results ?? {};
    const region =
        (results[country] && country) ||
        (results['US'] && 'US') ||
        Object.keys(results)[0];

    if (!region) {
        return null;
    }

    const regionProviders = results[region];
    const flatrate = normalizeProviderItems(regionProviders.flatrate);
    const rent = normalizeProviderItems(regionProviders.rent);
    const buy = normalizeProviderItems(regionProviders.buy);

    if (!flatrate.length && !rent.length && !buy.length) {
        return null;
    }

    return {
        region,
        link: regionProviders.link,
        flatrate,
        rent,
        buy,
    };
};

export const buildProviderPreview = (
    providers: WatchProviderCategories | null,
    maxVisible = HERO_PROVIDER_PREVIEW_COUNT,
): MediaDetailProviderPreview | null => {
    if (!providers) {
        return null;
    }

    const seen = new Set<number>();
    const previewProviders = [
        ...providers.flatrate,
        ...providers.rent,
        ...providers.buy,
    ].filter((provider): provider is WatchProviderItem => {
        const providerId = provider.provider_id;

        if (!providerId || seen.has(providerId)) {
            return false;
        }

        seen.add(providerId);
        return true;
    });

    if (!previewProviders.length) {
        return null;
    }

    return {
        providers: previewProviders.slice(0, maxVisible),
        hiddenCount: Math.max(0, previewProviders.length - maxVisible),
        link: providers.link ?? null,
    };
};
