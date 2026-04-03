import type { LoadableItems } from '../types';

export const loadedItems = <T>(state: LoadableItems<T>): T[] =>
    state.type === 'loaded' ? state.value : [];
