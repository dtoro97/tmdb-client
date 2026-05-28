const ENGLISH_LANGUAGE = 'en';
const NEUTRAL_IMAGE_LANGUAGE = 'null';

export function buildImageLanguageFallback(): string {
    return [ENGLISH_LANGUAGE, NEUTRAL_IMAGE_LANGUAGE].join(',');
}

export function isPreferredImageLanguage(
    imageLanguage: string | null | undefined,
    preferredLanguage: string | null | undefined,
): boolean {
    const preferred = normalizeLanguage(preferredLanguage);

    return (
        imageLanguage === null ||
        imageLanguage === ENGLISH_LANGUAGE ||
        (!!preferred && imageLanguage === preferred)
    );
}

function normalizeLanguage(language: string | null | undefined): string {
    return language?.split('-')[0]?.trim().toLowerCase() ?? '';
}
