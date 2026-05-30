import type { RemoteData } from '../types';

export const remoteData = <T>(state: RemoteData<T>, fallback: T): T =>
    state.state === 'success' || state.state === 'loading-more' ? state.data : fallback;

export const remoteSuccess = <T>(data: T): RemoteData<T> => ({
    state: 'success',
    data,
});

export const hasRemoteData = <T>(
    state: RemoteData<T>,
): state is Extract<RemoteData<T>, { state: 'success' | 'loading-more' }> =>
    state.state === 'success' || state.state === 'loading-more';

export const mapRemoteData = <T, R>(
    state: RemoteData<T>,
    mapData: (data: T) => R,
): RemoteData<R> => {
    switch (state.state) {
        case 'success':
            return { state: 'success', data: mapData(state.data) };
        case 'loading-more':
            return { state: 'loading-more', data: mapData(state.data) };
        case 'failure':
            return { state: 'failure', error: state.error };
        default:
            return { state: state.state };
    }
};

export const updateRemoteData = <T>(state: RemoteData<T>, update: (data: T) => T): RemoteData<T> =>
    hasRemoteData(state) ? { ...state, data: update(state.data) } : state;
