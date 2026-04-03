import { ExternalIds } from '../../api';

export type ExternalLinkImdbType = 'name' | 'title';

export interface ExternalLinks {
    readonly links: ExternalIds | null;
    readonly homepage: string | null;
    readonly imdbType: ExternalLinkImdbType;
}
