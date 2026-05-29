import type { RemoteData } from '../types';

export const remoteData = <T>(state: RemoteData<T>, fallback: T): T =>
    state.state === 'success' || state.state === 'loading-more' ? state.data : fallback;

export const remoteNotAsked = <T>(): RemoteData<T> => ({
    state: 'notAsked',
});

export const remoteSuccess = <T>(data: T): RemoteData<T> => ({
    state: 'success',
    data,
});

export const remoteLoadingMore = <T>(data: T): RemoteData<T> => ({
    state: 'loading-more',
    data,
});

export const remoteFailure = (error: unknown): RemoteData<never> => ({
    state: 'failure',
    error,
});

export const isRemoteSuccess = <T>(state: RemoteData<T>): state is Extract<RemoteData<T>, { state: 'success' }> =>
    state.state === 'success';

export const hasRemoteData = <T>(
    state: RemoteData<T>,
): state is Extract<RemoteData<T>, { state: 'success' | 'loading-more' }> =>
    state.state === 'success' || state.state === 'loading-more';

export const updateRemoteData = <T>(state: RemoteData<T>, update: (data: T) => T): RemoteData<T> =>
    hasRemoteData(state) ? { ...state, data: update(state.data) } : state;
