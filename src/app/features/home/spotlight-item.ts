import type { MediaType } from '../../shared';

export interface SpotlightItem {
    id: number;
    mediaType: MediaType;
    title: string;
    overview: string;
    backdropPath: string | null;
    rating: number | null;
    year: string;
    mediaTypeLabel: string;
}
