import { Country, Language } from '../../api';
import { SelectOption } from '../types';

export function toLanguageOptions(languages: readonly Language[]): SelectOption<string>[] {
    return languages
        .map((language) => {
            const value = language.iso_639_1?.trim().toLowerCase() ?? '';
            const label = language.english_name?.trim() || language.name?.trim() || value;

            return { value, label };
        })
        .filter((option) => !!option.value)
        .sort(compareOptions);
}

export function toRegionOptions(countries: readonly Country[], selectedRegion?: string): SelectOption<string>[] {
    const options = countries
        .map((country) => {
            const value = country.iso_3166_1?.trim().toUpperCase() ?? '';
            const label = country.english_name?.trim() || country.native_name?.trim() || value;

            return { value, label };
        })
        .filter((option) => !!option.value)
        .sort(compareOptions);

    if (selectedRegion && !options.some((option) => option.value === selectedRegion)) {
        return [{ value: selectedRegion, label: selectedRegion }, ...options];
    }

    return options;
}

function compareOptions(first: SelectOption<string>, second: SelectOption<string>): number {
    return first.label.localeCompare(second.label);
}
