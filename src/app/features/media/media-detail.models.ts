import {
    CastMember,
    CollectionDetails,
    CrewMember,
    KeywordListItem,
    Review,
    TvCreator,
    TvEpisode,
    WatchProviderItem,
} from '../../api';
import {
    CardItem,
    ExternalLinks,
    LoadableItems,
    LoadableValue,
    MediaDetails,
    PersonCardItem,
    ViewerImage,
} from '../../shared';

export type CastCreditWithEpisodes = CastMember & {
    episode_count?: number;
};

export type CrewCreditWithEpisodes = CrewMember & {
    episode_count?: number;
};

export interface MediaCreditsLinkItem {
    id?: number | null;
    name?: string | null;
}

export interface MediaCreditsPanelData {
    topCastState: LoadableItems<PersonCardItem>;
    castState: LoadableItems<unknown>;
    crewState: LoadableItems<unknown>;
    directors: readonly MediaCreditsLinkItem[];
    creators: readonly TvCreator[];
}

export interface MediaDetailProviderPreview {
    providers: WatchProviderItem[];
    hiddenCount: number;
    link: string | null;
}

export interface MediaDetailPhotosSection {
    state: LoadableItems<ViewerImage>;
    allPhotos: ViewerImage[];
    totalCount: number;
}

export interface MediaDetailReviewsSection {
    state: LoadableItems<Review>;
    previewReviews: Review[];
    totalResults: number;
    hasMore: boolean;
}
