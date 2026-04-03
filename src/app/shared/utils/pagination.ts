import { Observable, of, map, tap } from 'rxjs';

export interface PagedLoadConfig<T> {
    readonly currentItems: T[];
    readonly currentPage: number;
    readonly totalPages: number;
    readonly placeholderCount: number;
    setLoadingMore(items: T[]): void;
    fetchPage(nextPage: number): Observable<T[]>;
    setLoaded(items: T[], page: number): void;
}

export function loadMorePaged$<T>(config: PagedLoadConfig<T>): Observable<void> {
    if (config.currentPage >= config.totalPages) {
        return of(undefined);
    }

    const nextPage = config.currentPage + 1;
    config.setLoadingMore(config.currentItems);

    return config.fetchPage(nextPage).pipe(
        tap((newItems) =>
            config.setLoaded([...config.currentItems, ...newItems], nextPage),
        ),
        map(() => undefined),
    );
}
