import type { LoadableItems, LoadableValue } from '../types';

export const loadedItems = <T>(state: LoadableItems<T>): T[] => (state.type === 'loaded' ? state.value : []);

export const toLoadedItems = <T>(value: readonly T[]): LoadableItems<T> => ({
    type: 'loaded',
    value: [...value],
});

export const toLoadedValue = <T>(value: T): LoadableValue<T> => ({
    type: 'loaded',
    value,
});

export const updateLoadedItems = <T>(
    state: LoadableItems<T>,
    update: (items: readonly T[]) => readonly T[],
): LoadableItems<T> => (state.type === 'loaded' ? toLoadedItems(update(state.value)) : state);

export function loaded<T>(value: T[]): LoadableItems<T>;
export function loaded<T>(value: T): LoadableValue<T>;
export function loaded<T>(value: T | T[]): LoadableItems<T> | LoadableValue<T> {
    return { type: 'loaded', value } as LoadableItems<T> | LoadableValue<T>;
}

export const loadedValue = <T>(state: LoadableItems<T>) => {
    return state.type === 'loaded' ? state.value : [];
};
