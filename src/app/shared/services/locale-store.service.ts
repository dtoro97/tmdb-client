import { afterNextRender, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import { BrowserStorageService } from './browser-storage.service';
import { parseRegionParam } from '../utils/route-utils';

const STORAGE_KEY_LANGUAGE = 'tmdb_language';
const STORAGE_KEY_REGION = 'tmdb_region';
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_REGION = 'US';

interface LocaleState {
    readonly language: string;
    readonly region: string;
}

@Injectable({ providedIn: 'root' })
export class LocaleStoreService extends ComponentStore<LocaleState> {
    readonly language$ = this.select((state) => state.language);
    readonly region$ = this.select((state) => state.region);
    readonly locale$ = this.select((state) => ({
        language: state.language,
        region: state.region,
    }));

    constructor(private readonly browserStorage: BrowserStorageService) {
        super({
            language: normalizeLanguage(
                browserStorage.getCookieOrDefault(
                    STORAGE_KEY_LANGUAGE,
                    DEFAULT_LANGUAGE,
                ),
            ),
            region: parseRegionParam(
                browserStorage.getCookieOrDefault(
                    STORAGE_KEY_REGION,
                    DEFAULT_REGION,
                ),
                DEFAULT_REGION,
            ),
        });

        afterNextRender(() => {
            this.hydrateBrowserLocale();
        });
    }

    language(): string {
        return this.get().language;
    }

    region(): string {
        return this.get().region;
    }

    setLanguage(iso639: string): void {
        const language = normalizeLanguage(iso639);

        this.patchState({ language });
        this.persistLocale(language, this.get().region);
        this.reloadBrowserPage();
    }

    setRegion(iso3166: string): void {
        const region = parseRegionParam(iso3166, DEFAULT_REGION);

        this.patchState({ region });
        this.persistLocale(this.get().language, region);
        this.reloadBrowserPage();
    }

    private hydrateBrowserLocale(): void {
        if (!this.browserStorage.isBrowserEnvironment()) {
            return;
        }

        const current = this.get();
        const cookieLanguage = this.browserStorage.getCookie(
            STORAGE_KEY_LANGUAGE,
        );
        const cookieRegion = this.browserStorage.getCookie(STORAGE_KEY_REGION);
        const storedLanguage = this.browserStorage.getItem(
            STORAGE_KEY_LANGUAGE,
        );
        const storedRegion = this.browserStorage.getItem(STORAGE_KEY_REGION);
        const nextLanguage = normalizeLanguage(
            cookieLanguage ?? storedLanguage ?? current.language,
        );
        const nextRegion = parseRegionParam(
            cookieRegion ?? storedRegion ?? current.region,
            DEFAULT_REGION,
        );
        const shouldPromoteStoredLocale =
            (cookieLanguage === null || cookieRegion === null) &&
            (storedLanguage !== null || storedRegion !== null);

        if (shouldPromoteStoredLocale) {
            this.persistLocale(nextLanguage, nextRegion);

            const cookiesWereWritten =
                this.browserStorage.getCookie(STORAGE_KEY_LANGUAGE) ===
                    nextLanguage &&
                this.browserStorage.getCookie(STORAGE_KEY_REGION) ===
                    nextRegion;

            if (
                cookiesWereWritten &&
                (nextLanguage !== current.language ||
                    nextRegion !== current.region)
            ) {
                this.reloadBrowserPage();
                return;
            }
        }

        if (cookieLanguage !== null || cookieRegion !== null) {
            this.persistLocale(current.language, current.region);
        }
    }

    private persistLocale(language: string, region: string): void {
        this.browserStorage.setItem(STORAGE_KEY_LANGUAGE, language);
        this.browserStorage.setCookie(STORAGE_KEY_LANGUAGE, language);
        this.browserStorage.setItem(STORAGE_KEY_REGION, region);
        this.browserStorage.setCookie(STORAGE_KEY_REGION, region);
    }

    private reloadBrowserPage(): void {
        if (!this.browserStorage.isBrowserEnvironment()) {
            return;
        }

        window.location.reload();
    }
}

function normalizeLanguage(value: string): string {
    return (value.split('-')[0] || DEFAULT_LANGUAGE).toLowerCase();
}
