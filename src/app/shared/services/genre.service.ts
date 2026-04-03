import { Injectable } from '@angular/core';

import { map, Observable, shareReplay } from 'rxjs';

import { GenreRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';

type MediaGenreType = 'movie' | 'tv';

@Injectable({
    providedIn: 'root',
})
export class GenreService {
    readonly movieGenres$ = this.genreService.genreMovieList(
        undefined,
        'body',
        false,
        API_JSON_OPTIONS,
    ).pipe(
        map((response) => this.toGenreMap(response.genres)),
        shareReplay(1),
    );

    readonly tvGenres$ = this.genreService.genreTvList(
        undefined,
        'body',
        false,
        API_JSON_OPTIONS,
    ).pipe(
        map((response) => this.toGenreMap(response.genres)),
        shareReplay(1),
    );

    constructor(private readonly genreService: GenreRestControllerService) {}

    getGenreNames(
        genreIds: number[],
        mediaType: MediaGenreType,
    ): Observable<string[]> {
        const source$ =
            mediaType === 'movie' ? this.movieGenres$ : this.tvGenres$;

        return source$.pipe(
            map((genreMap) =>
                genreIds
                    .map((genreId) => genreMap.get(genreId))
                    .filter((genreName): genreName is string => !!genreName),
            ),
        );
    }

    private toGenreMap(
        genres: ReadonlyArray<{ id?: number; name?: string }> | null | undefined,
    ): Map<number, string> {
        return new Map(
            (genres ?? [])
                .filter(
                    (genre): genre is { id: number; name: string } =>
                        typeof genre.id === 'number' &&
                        typeof genre.name === 'string' &&
                        genre.name.length > 0,
                )
                .map((genre) => [genre.id, genre.name]),
        );
    }
}
