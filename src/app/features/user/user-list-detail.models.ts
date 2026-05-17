import { V4ListContentItem, V4ListDetails } from '../../api-v4';
import { CardItem, toUpdatedAtLabel } from '../../shared';

interface ListCreatorShape {
    readonly username?: string | null;
    readonly name?: string | null;
}

export type UserListSortBy =
    | 'original_order.asc'
    | 'original_order.desc'
    | 'title.asc'
    | 'title.desc'
    | 'primary_release_date.asc'
    | 'primary_release_date.desc';

export interface UserListDetailHeader {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly createdBy: string | null;
    readonly isOwnedByCurrentUser: boolean;
    readonly itemCount: number;
    readonly itemCountLabel: string;
    readonly favoriteCount: number | null;
    readonly favoriteCountLabel: string | null;
    readonly updatedLabel: string | null;
    readonly posterPath: string | null;
    readonly backdropPath: string | null;
    readonly isPublic: boolean | null;
    readonly visibilityLabel: string | null;
    readonly sortBy: UserListSortBy;
}

export interface UserListDetailItem extends CardItem {
    readonly key: string;
    readonly comment: string | null;
}

export interface UserListDetailPageResult {
    readonly header: UserListDetailHeader;
    readonly items: readonly UserListDetailItem[];
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
}

export interface UpdateUserListRequest {
    readonly name: string;
    readonly description: string;
    readonly isPublic: boolean;
}

function toCountLabel(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function toTrimmedString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue || null;
}

function toCreatorName(value: unknown): string | null {
    const directName = toTrimmedString(value);

    if (directName) {
        return directName;
    }

    if (!value || typeof value !== 'object') {
        return null;
    }

    const creator = value as ListCreatorShape;

    return toTrimmedString(creator.username) ?? toTrimmedString(creator.name);
}

export function toUserListSortBy(
    value: string | null | undefined,
): UserListSortBy {
    if (
        value === 'original_order.asc' ||
        value === 'original_order.desc' ||
        value === 'title.asc' ||
        value === 'title.desc' ||
        value === 'primary_release_date.asc' ||
        value === 'primary_release_date.desc'
    ) {
        return value;
    }

    return 'original_order.asc';
}

export function toListItemKey(mediaType: 'movie' | 'tv', id: number): string {
    return `${mediaType}:${id}`;
}

export function toUserListDetailItem(
    item: V4ListContentItem,
): UserListDetailItem | null {
    if (!item.id || !item.media_type) {
        return null;
    }

    const mediaType =
        item.media_type === 'tv'
            ? 'tv'
            : item.media_type === 'movie'
              ? 'movie'
              : null;
    const title =
        (mediaType === 'tv' ? item.name : item.title)?.trim() ||
        item.title?.trim() ||
        item.name?.trim();

    if (!mediaType || !title) {
        return null;
    }

    return {
        key: toListItemKey(mediaType, item.id),
        id: item.id,
        mediaType,
        title,
        imagePath: item.poster_path ?? null,
        backdropPath: item.backdrop_path ?? null,
        rating: item.vote_average ?? null,
        date:
            mediaType === 'tv'
                ? item.first_air_date ?? ''
                : item.release_date ?? '',
        overview: item.overview ?? '',
        comment: toTrimmedString(item.comment),
    };
}

export function toUserListDetailPage(
    result: V4ListDetails,
    currentUsername?: string | null,
): UserListDetailPageResult {
    const items = (result.results ?? [])
        .map((item) => toUserListDetailItem(item))
        .filter((item): item is UserListDetailItem => item !== null);

    return {
        header: {
            id: result.id ?? 0,
            name: toTrimmedString(result.name) ?? 'Untitled List',
            description: toTrimmedString(result.description),
            createdBy: toCreatorName((result as V4ListDetails & { created_by?: unknown }).created_by),
            isOwnedByCurrentUser:
                !!currentUsername &&
                toCreatorName((result as V4ListDetails & { created_by?: unknown }).created_by)?.toLocaleLowerCase() ===
                    currentUsername.trim().toLocaleLowerCase(),
            itemCount: result.item_count ?? items.length,
            itemCountLabel: toCountLabel(
                result.item_count ?? items.length,
                'title',
            ),
            favoriteCount: result.favorite_count ?? null,
            favoriteCountLabel:
                typeof result.favorite_count === 'number'
                    ? toCountLabel(result.favorite_count, 'favorite')
                    : null,
            updatedLabel: toUpdatedAtLabel(result.updated_at ?? result.created_at),
            posterPath: result.poster_path ?? null,
            backdropPath:
                items.find((item) => !!item.backdropPath)?.backdropPath ??
                result.poster_path ??
                null,
            isPublic:
                typeof result.public === 'boolean' ? result.public : null,
            visibilityLabel:
                typeof result.public === 'boolean'
                    ? result.public
                        ? 'Public list'
                        : 'Private list'
                    : null,
            sortBy: toUserListSortBy(result.sort_by),
        },
        items,
        page: result.page ?? 1,
        totalPages: result.total_pages ?? 1,
        totalResults: result.total_results ?? result.item_count ?? items.length,
    };
}
