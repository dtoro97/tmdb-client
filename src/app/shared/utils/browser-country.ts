export function getBrowserCountry(): string {
    const language =
        typeof navigator !== 'undefined' ? navigator.language : '';
    const region = language.split('-')[1]?.toUpperCase();

    return /^[A-Z]{2}$/.test(region ?? '') ? region! : 'US';
}
