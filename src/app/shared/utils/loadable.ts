import type { LoadableItems, LoadableValue } from '../types';

export const loadedItems = <T>(state: LoadableItems<T>): T[] =>
    state.type === 'loaded' ? state.value : [];

export function loaded<T>(value: T[]): LoadableItems<T>;
export function loaded<T>(value: T): LoadableValue<T>;
export function loaded<T>(
    value: T | T[],
): LoadableItems<T> | LoadableValue<T> {
    return { type: 'loaded', value } as LoadableItems<T> | LoadableValue<T>;
}

export const mapLoadableValue = <T, U>(
    state: LoadableValue<T>,
    mapValue: (value: T) => U,
): LoadableValue<U> => {
    if (state.type !== 'loaded') {
        return state;
    }

    return {
        type: 'loaded',
        value: mapValue(state.value),
    };
};

export function mapLoadableItems<T, U>(
    state: LoadableItems<T>,
    transform: (item: T) => U,
): LoadableItems<U> {
    if (state.type === 'loaded') {
        return loaded(state.value.map(transform));
    }

    if (state.type === 'loading-more') {
        return {
            type: 'loading-more',
            value: state.value.map(transform),
            placeholderCount: state.placeholderCount,
        };
    }

    return state;
}

export function updateLoadableItems<T>(
    state: LoadableItems<T>,
    updater: (items: T[]) => T[],
): LoadableItems<T> {
    if (state.type === 'loaded') {
        return loaded(updater(state.value));
    }

    if (state.type === 'loading-more') {
        return {
            ...state,
            value: updater(state.value),
        };
    }

    return state;
}

export function combineLoadablePreviewItems<T>(
    states: readonly LoadableItems<T>[],
    previewCount: number,
): LoadableItems<T> {
    if (states.some((state) => state.type === 'loading')) {
        return { type: 'loading' };
    }

    const loadedValues = states.flatMap((state) => {
        if (state.type === 'loaded' || state.type === 'loading-more') {
            return state.value;
        }

        return [];
    });

    if (loadedValues.length > 0) {
        return loaded(loadedValues.slice(0, previewCount));
    }

    if (
        states.every(
            (state) => state.type === 'loaded' || state.type === 'loading-more',
        )
    ) {
        return loaded([]);
    }

    return { type: 'idle' };
}
