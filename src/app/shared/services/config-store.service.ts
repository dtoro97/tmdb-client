import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ConfigurationRestControllerService, Language } from '../../api';
import { filter, tap } from 'rxjs';
import { isDefined } from '../utils';

export type ConfigStoreState = {
    languages?: Language[];
};

@Injectable({ providedIn: 'root' })
export class ConfigStoreService extends ComponentStore<ConfigStoreState> {
    languages$ = this.select((state) => state.languages).pipe(
        filter(isDefined),
    );
    constructor(
        private configRestControllerService: ConfigurationRestControllerService,
    ) {
        super({});
        this.configRestControllerService
            .configurationLanguages(undefined, undefined, {
                httpHeaderAccept: 'application/json',
            })
            .pipe(tap((response) => this.patchState({ languages: response })))
            .subscribe();
    }
}
