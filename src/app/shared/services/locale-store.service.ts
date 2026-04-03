import { Injectable, signal } from '@angular/core';
import { BrowserStorageService } from './browser-storage.service';
import { getBrowserCountry } from '../utils/browser-country';

const STORAGE_KEY_LANGUAGE = 'tmdb_language';
const STORAGE_KEY_REGION = 'tmdb_region';

@Injectable({ providedIn: 'root' })
export class LocaleStoreService {
    readonly language;
    readonly region;

    constructor(private readonly browserStorage: BrowserStorageService) {
        this.language = signal(
            this.browserStorage.getItemOrDefault(
                STORAGE_KEY_LANGUAGE,
                this.getBrowserLanguage(),
            ),
        );
        this.region = signal(
            this.browserStorage.getItemOrDefault(
                STORAGE_KEY_REGION,
                getBrowserCountry(),
            ),
        );
    }

    setLanguage(iso639: string): void {
        this.language.set(iso639);
        this.browserStorage.setItem(STORAGE_KEY_LANGUAGE, iso639);
    }

    setRegion(iso3166: string): void {
        this.region.set(iso3166);
        this.browserStorage.setItem(STORAGE_KEY_REGION, iso3166);
    }

    private getBrowserLanguage(): string {
        const lang =
            typeof navigator !== 'undefined' ? navigator.language : 'en';
        return lang.split('-')[0]?.toLowerCase() ?? 'en';
    }
}
