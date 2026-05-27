import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import { BrowserStorageService } from './browser-storage.service';
import { getBrowserCountry } from '../utils/browser-country';

const STORAGE_KEY_LANGUAGE = 'tmdb_language';
const STORAGE_KEY_REGION = 'tmdb_region';

const getBrowserLanguage = (): string => {
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
    return lang.split('-')[0]?.toLowerCase() ?? 'en';
};

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
            language: browserStorage.getItemOrDefault(
                STORAGE_KEY_LANGUAGE,
                getBrowserLanguage(),
            ),
            region: browserStorage.getItemOrDefault(
                STORAGE_KEY_REGION,
                getBrowserCountry(),
            ),
        });
    }

    language(): string {
        return this.get().language;
    }

    region(): string {
        return this.get().region;
    }

    setLanguage(iso639: string): void {
        this.patchState({ language: iso639 });
        this.browserStorage.setItem(STORAGE_KEY_LANGUAGE, iso639);
    }

    setRegion(iso3166: string): void {
        this.patchState({ region: iso3166 });
        this.browserStorage.setItem(STORAGE_KEY_REGION, iso3166);
    }

    setLocale(language: string, region: string): void {
        this.patchState({ language, region });
        this.browserStorage.setItem(STORAGE_KEY_LANGUAGE, language);
        this.browserStorage.setItem(STORAGE_KEY_REGION, region);
    }
}
