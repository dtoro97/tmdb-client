import { Injectable, signal } from '@angular/core';
import { getBrowserCountry } from '../utils/browser-country';

const STORAGE_KEY_LANGUAGE = 'tmdb_language';
const STORAGE_KEY_REGION = 'tmdb_region';

function getBrowserLanguage(): string {
    const lang =
        typeof navigator !== 'undefined' ? navigator.language : 'en';
    return lang.split('-')[0]?.toLowerCase() ?? 'en';
}

function readStorage(key: string, fallback: string): string {
    if (typeof localStorage === 'undefined') {
        return fallback;
    }
    return localStorage.getItem(key) ?? fallback;
}

@Injectable({ providedIn: 'root' })
export class LocaleStoreService {
    readonly language = signal(
        readStorage(STORAGE_KEY_LANGUAGE, getBrowserLanguage()),
    );
    readonly region = signal(
        readStorage(STORAGE_KEY_REGION, getBrowserCountry()),
    );

    setLanguage(iso639: string): void {
        this.language.set(iso639);
        localStorage.setItem(STORAGE_KEY_LANGUAGE, iso639);
    }

    setRegion(iso3166: string): void {
        this.region.set(iso3166);
        localStorage.setItem(STORAGE_KEY_REGION, iso3166);
    }
}
