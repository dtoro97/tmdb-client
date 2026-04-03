import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { AsyncPipe } from '@angular/common';
import {
    BehaviorSubject,
    combineLatest,
    map,
    Observable,
    startWith,
} from 'rxjs';

import { ConfigStoreService } from '../../../services/config-store.service';
import { LocaleStoreService } from '../../../services/locale-store.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormsModule } from '@angular/forms';

interface SelectOption {
    readonly value: string;
    readonly label: string;
}

@Component({
    selector: 'app-header-locale-selector',
    imports: [
        MatIconModule,
        MatMenuModule,
        MatSelectModule,
        AsyncPipe,
        NgxMatSelectSearchModule,
        FormsModule,
    ],
    templateUrl: './header-locale-selector.component.html',
    styleUrl: './header-locale-selector.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderLocaleSelectorComponent {
    languageOptions$!: Observable<readonly SelectOption[]>;
    countryOptions$!: Observable<readonly SelectOption[]>;
    readonly selectedLanguage: string;
    readonly selectedRegion: string;
    private languageFilter = new BehaviorSubject('');
    private regionFilter = new BehaviorSubject('');

    constructor(
        private readonly configStore: ConfigStoreService,
        private readonly localeStore: LocaleStoreService,
    ) {
        this.selectedLanguage = this.localeStore.language();
        this.selectedRegion = this.localeStore.region();
        this.languageOptions$ = combineLatest([
            this.configStore.languages$,
            this.languageFilter,
        ]).pipe(
            map(([languages, filter]) =>
                languages
                    .filter((l) => !!l.iso_639_1)
                    .map((l) => ({
                        value: l.iso_639_1!,
                        label: l.english_name ?? l.iso_639_1!,
                    }))
                    .filter((o) => this.filterOption(o, filter || ''))
                    .sort((a, b) => a.label.localeCompare(b.label)),
            ),
        );

        this.countryOptions$ = combineLatest([
            this.configStore.countries$,
            this.regionFilter,
        ]).pipe(
            map(([countries, filter]) =>
                countries
                    .filter((c) => !!c.iso_3166_1)
                    .map((c) => ({
                        value: c.iso_3166_1!,
                        label: c.english_name ?? c.iso_3166_1!,
                    }))
                    .filter((o) => this.filterOption(o, filter || ''))
                    .sort((a, b) => a.label.localeCompare(b.label)),
            ),
        );
    }

    onLanguageChange(value: string): void {
        this.localeStore.setLanguage(value);
        location.reload();
    }

    onRegionChange(value: string): void {
        this.localeStore.setRegion(value);
        location.reload();
    }

    updateLanguageFilter(filter: string) {
        this.languageFilter.next(filter);
    }

    updateRegionFilter(filter: string) {
        this.regionFilter.next(filter);
    }

    private filterOption(option: SelectOption, filter: string) {
        return (
            option.label
                .toLocaleLowerCase()
                .includes(filter.toLocaleLowerCase()) ||
            option.value
                .toLocaleLowerCase()
                .includes(filter.toLocaleLowerCase())
        );
    }
}
