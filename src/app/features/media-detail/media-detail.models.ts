import {
    CollectionDetails,
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

export interface MediaDetailVm {
    media: MediaDetails;
    tvYearLabel: string | null;
    externalLinks: ExternalLinks | null;
    certification: LoadableValue<string | null>;
    watchProviders: LoadableValue<MediaDetailProviderPreview | null>;
    creditsPanel: MediaCreditsPanelData & { showPanel: boolean };
    collection: LoadableValue<CollectionDetails | null>;
    latestEpisode: LoadableValue<TvEpisode | null>;
    photos: MediaDetailPhotosSection;
    reviews: MediaDetailReviewsSection;
    recommendations: LoadableItems<CardItem>;
    keywords: LoadableItems<KeywordListItem>;
}
