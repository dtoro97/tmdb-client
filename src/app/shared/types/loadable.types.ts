export type RemoteData<T> =
    | { readonly state: 'notAsked' }
    | { readonly state: 'loading' }
    | { readonly state: 'loading-more'; readonly data: T }
    | { readonly state: 'success'; readonly data: T }
    | { readonly state: 'failure'; readonly error: unknown };
