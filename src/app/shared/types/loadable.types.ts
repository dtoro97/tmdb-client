export type LoadableItems<T> =
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'loading-more'; value: T[]; placeholderCount: number }
    | { type: 'loaded'; value: T[] };

export type LoadableValue<T> =
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'loaded'; value: T };
