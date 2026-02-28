import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
    ConfigurationRestControllerService,
    Country,
    Language,
} from '../../api';
import { combineLatest, filter, tap } from 'rxjs';
import { isDefined } from '../utils';

export type ConfigStoreState = {
    languages?: Language[];
    countries?: Country[];
};

@Injectable({ providedIn: 'root' })
export class ConfigStoreService extends ComponentStore<ConfigStoreState> {
    languages$ = this.select((state) => state.languages).pipe(
        filter(isDefined),
    );
    countries$ = this.select((state) => state.countries).pipe(
        filter(isDefined),
    );
    constructor(
        private configRestControllerService: ConfigurationRestControllerService,
    ) {
        super({});

        combineLatest([this.getLanguages$(), this.getCountries$()]).subscribe();
    }

    getLanguages$() {
        return this.configRestControllerService
            .configurationLanguages(undefined, undefined, {
                httpHeaderAccept: 'application/json',
            })
            .pipe(tap((response) => this.patchState({ languages: response })));
    }

    getCountries$() {
        return this.configRestControllerService
            .configurationCountries(undefined, undefined, undefined, {
                httpHeaderAccept: 'application/json',
            })
            .pipe(tap((response) => this.patchState({ countries: response })));
    }
}
