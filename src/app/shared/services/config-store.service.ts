import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
    ConfigurationRestControllerService,
    Country,
    Language,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { filter, tap } from 'rxjs';
import { isDefined } from '../utils';
import { Configuration } from '../../api/configuration';

export type ConfigStoreState = {
    languages?: Language[];
    countries?: Country[];
    config?: Configuration;
};

@Injectable({ providedIn: 'root' })
export class ConfigStoreService extends ComponentStore<ConfigStoreState> {
    languages$ = this.select((state) => state.languages).pipe(
        filter(isDefined),
    );
    countries$ = this.select((state) => state.countries).pipe(
        filter(isDefined),
    );
    configuration$ = this.select((state) => state.config).pipe(
        filter(isDefined),
    );
    constructor(
        private configRestControllerService: ConfigurationRestControllerService,
    ) {
        super({});

        this.getLanguages$().subscribe();
        this.getCountries$().subscribe();
        this.getConfiguration$().subscribe();
    }

    getLanguages$() {
        return this.configRestControllerService
            .configurationLanguages(undefined, undefined, API_JSON_OPTIONS)
            .pipe(tap((response) => this.patchState({ languages: response })));
    }

    getCountries$() {
        return this.configRestControllerService
            .configurationCountries(undefined, undefined, undefined, API_JSON_OPTIONS)
            .pipe(tap((response) => this.patchState({ countries: response })));
    }

    getConfiguration$() {
        return this.configRestControllerService
            .configurationDetails(undefined, undefined, API_JSON_OPTIONS)
            .pipe(tap((response) => this.patchState({ config: response })));
    }
}
