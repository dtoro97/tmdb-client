import { V4ListSortBy } from '../../api-v4';
import type { SelectOption, SortDirection } from '../../shared';

export type UserListSortOption = SelectOption<V4ListSortBy>;
export type UserAccountSortField = 'created_at';
export type UserAccountSortOption = SelectOption<UserAccountSortField>;
export type UserAccountSortBy = 'created_at.asc' | 'created_at.desc';

export const DEFAULT_USER_LIST_SORT_BY = V4ListSortBy.OriginalOrderAsc;
export const DEFAULT_USER_ACCOUNT_SORT_FIELD: UserAccountSortField =
    'created_at';
export const DEFAULT_USER_ACCOUNT_SORT_DIRECTION: SortDirection = 'desc';
export const DEFAULT_USER_ACCOUNT_SORT_BY: UserAccountSortBy =
    'created_at.desc';

export const USER_ACCOUNT_SORT_OPTIONS: readonly UserAccountSortOption[] = [
    { label: 'Date added', value: 'created_at' },
];

export const USER_LIST_SORT_OPTIONS: readonly UserListSortOption[] = [
    { label: 'Original order', value: V4ListSortBy.OriginalOrderAsc },
    {
        label: 'Original order, newest first',
        value: V4ListSortBy.OriginalOrderDesc,
    },
    { label: 'Title A-Z', value: V4ListSortBy.TitleAsc },
    { label: 'Title Z-A', value: V4ListSortBy.TitleDesc },
    {
        label: 'Release date, oldest first',
        value: V4ListSortBy.PrimaryReleaseDateAsc,
    },
    {
        label: 'Release date, newest first',
        value: V4ListSortBy.PrimaryReleaseDateDesc,
    },
    { label: 'Rating, low to high', value: V4ListSortBy.VoteAverageAsc },
    { label: 'Rating, high to low', value: V4ListSortBy.VoteAverageDesc },
];
