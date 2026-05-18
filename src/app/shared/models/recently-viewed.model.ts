import { CardItem, PersonCardItem } from './content-items.model';

export type RecentlyViewedMediaItem = CardItem & {
    kind: 'media';
};

export type RecentlyViewedPersonItem = PersonCardItem & {
    kind: 'person';
};

export type RecentlyViewedItem =
    | RecentlyViewedMediaItem
    | RecentlyViewedPersonItem;
