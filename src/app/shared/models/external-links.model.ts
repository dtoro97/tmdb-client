import { ExternalIds, TvExternalIds } from '../../api';

export type ExternalLinkImdbType = 'name' | 'title';
type ExternalIdsResource = ExternalIds | TvExternalIds;

export interface ExternalLinks {
    readonly links: ExternalIdsResource | null;
    readonly homepage: string | null;
    readonly imdbType: ExternalLinkImdbType;
}

export interface ExternalLinksParams {
    readonly links?: ExternalIdsResource | null;
    readonly homepage?: string | null;
    readonly imdbType: ExternalLinkImdbType;
}

export const buildExternalLinks = ({
    links = null,
    homepage = null,
    imdbType,
}: ExternalLinksParams): ExternalLinks | null => {
    const normalizedHomepage = homepage || null;

    if (!links && !normalizedHomepage) {
        return null;
    }

    return { links, homepage: normalizedHomepage, imdbType };
};
