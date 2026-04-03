export type { SortDirection } from '../types';
import type { SortDirection } from '../types';

type Sortable = string | number | null | undefined;

export const compareValues = (a: Sortable, b: Sortable): number => {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    return String(a).localeCompare(String(b));
};

export const sortBy = <T>(
    items: T[],
    selector: (item: T) => Sortable,
    direction: SortDirection = 'asc',
): T[] => {
    const factor = direction === 'asc' ? 1 : -1;
    return [...items].sort((left, right) => {
        return compareValues(selector(left), selector(right)) * factor;
    });
};

export const sortByDate = <T>(
    items: T[],
    selector: (item: T) => string | null | undefined,
    direction: SortDirection = 'asc',
): T[] => {
    return sortBy(
        items,
        (item) => {
            const value = selector(item);
            if (!value) return null;
            const timestamp = Date.parse(value);
            return Number.isNaN(timestamp) ? null : timestamp;
        },
        direction,
    );
};
