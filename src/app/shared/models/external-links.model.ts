import { ExternalIds } from '../../api';

export type ExternalLinkImdbType = 'name' | 'title';

export interface ExternalLinks {
    readonly links: ExternalIds | null;
    readonly homepage: string | null;
    readonly imdbType: ExternalLinkImdbType;
}

export const buildExternalLinks = (
    links: ExternalIds | null,
    homepage: string | null,
    imdbType: ExternalLinkImdbType,
): ExternalLinks | null => {
    if (!links && !homepage) {
        return null;
    }

    return { links, homepage, imdbType };
};
