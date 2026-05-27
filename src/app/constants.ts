export const PAGE_SIZE = 20;
export const MAX_PAGES = 500;
export const SMALL_LIST_COUNT = 5;

export const MEDIUM_LIST_COUNT = 10;

export const PHOTOS_GRID_FIRST_ROW = 3;
export const GRID_COUNT = 4;
export const MAX_VISIBLE_PHOTOS = 9;
export const PHOTOS_BROWSER_BATCH = 18;

export const SEED_COUNT = 30;
export const CAROUSEL_COUNT = 6;

export const TRAILERS_PAGE_SEED_COUNT = 60;
export const RELATED_COUNT = 12;
export const PHOTOS_SKELETON_COUNT = 9;

export const API_JSON_OPTIONS = {
    httpHeaderAccept: 'application/json' as const,
};

export const API_PRIVATE_JSON_OPTIONS = {
    httpHeaderAccept: 'application/json' as const,
    transferCache: false,
};
