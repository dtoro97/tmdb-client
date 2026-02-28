import {
    catchError,
    combineLatest,
    EMPTY,
    filter,
    forkJoin,
    iif,
    map,
    Observable,
    of,
    shareReplay,
    switchMap,
    tap,
} from 'rxjs';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import {
    AggregateCredits,
    CastMember,
    CollectionDetails,
    CollectionRestControllerService,
    Credits,
    CrewMember,
    ExternalIds,
    Image,
    ImageList,
    ItemWithNameAndId,
    Language,
    Movie,
    MovieListItemForList,
    MovieRestControllerService,
    Network,
    TvCreator,
    TvEpisode,
    TvSeason,
    TvSeries,
    TvSeasonRestControllerService,
    TvSeriesRestControllerService,
    Video,
} from '../../api';
import {
    ConfigStoreService,
    isDefined,
    loader,
    ViewerImage,
} from '../../shared';

export type MediaEnriched = (Movie | TvSeries) & {
    credits?: Credits;
    aggregate_credits?: AggregateCredits;
    videos?: { results?: Video[] };
    similar?: { results?: unknown[] };
    recommendations?: { results?: unknown[] };
    external_ids?: ExternalIds;
    images?: ImageList;
};

export interface MediaViewModel {
    id: number;
    title: string;
    year: string;
    overview: string;
    genres: ItemWithNameAndId[];
    voteAverage: number;
    posterPath: string | null;
    backdropPath: string | null;
    status?: string;
    languages: string[];
    mediaType: 'movie' | 'tv';

    // Movie-only
    releaseDate?: string;
    runtime?: number;
    budget?: number;
    revenue?: number;

    // TV-only
    firstAirDate?: string;
    lastAirDate?: string;
    creators?: TvCreator[];
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
    networks?: Network[];
}

export interface MediaState {
    media?: MediaEnriched;
    seasons: TvSeason[];
    selectedSeason?: number;
    type: string;
    lists?: MovieListItemForList[];
}

@Injectable()
export class MediaDetailStoreService extends ComponentStore<MediaState> {
    media$ = this.select((state) => state.media).pipe(filter(isDefined));

    cast$: Observable<CastMember[]> = this.media$.pipe(
        map((m) => {
            if (m.aggregate_credits?.cast?.length) {
                return m.aggregate_credits.cast.map((ac) => {
                    const roles = (ac.roles ?? [])
                        .map((r) => r.character)
                        .filter(Boolean);
                    const rest = roles.length - 1;
                    const character = roles.length
                        ? roles[0] + (rest > 0 ? ` +${rest} more` : '')
                        : '';
                    return { ...ac, character } as CastMember;
                });
            }
            return m.credits?.cast ?? [];
        }),
    );

    crew$: Observable<CrewMember[]> = this.media$.pipe(
        map((m) => (m.credits?.crew ?? []) as CrewMember[]),
    );

    directors$: Observable<CrewMember[]> = this.media$.pipe(
        map((m) => {
            const crew = (m.credits?.crew ?? []) as CrewMember[];
            const seen = new Set<number>();
            return crew.filter((c) => {
                if (c.job !== 'Director' || seen.has(c.id!)) return false;
                seen.add(c.id!);
                return true;
            });
        }),
    );

    socialLinks$ = this.media$.pipe(
        map((m) => m.external_ids),
        filter(isDefined),
    );

    recommendations$ = this.media$.pipe(
        map((m) => {
            const items = (m.similar?.results ?? []) as Record<
                string,
                unknown
            >[];
            return [...items].sort(
                (a, b) =>
                    ((b['vote_average'] as number) ?? 0) -
                    ((a['vote_average'] as number) ?? 0),
            );
        }),
    );

    collection$: Observable<CollectionDetails | null> = this.media$.pipe(
        switchMap((media) => {
            const collection = (media as Movie).belongs_to_collection;
            if (!collection?.id) return of(null);
            return this.collectionRestControllerService
                .collectionDetails(
                    collection.id,
                    undefined,
                    undefined,
                    undefined,
                    { httpHeaderAccept: 'application/json' },
                )
                .pipe(catchError(() => of(null)));
        }),
        shareReplay(1),
    );

    allVideos$ = this.media$.pipe(
        map((m) =>
            (m.videos?.results ?? []).filter((v) => v.site === 'YouTube'),
        ),
    );

    featuredVideos$ = this.allVideos$.pipe(map((vs) => vs.slice(0, 2)));
    gridVideos$ = this.allVideos$.pipe(map((vs) => vs.slice(2, 6)));
    youtubeVideosTotalCount$ = this.allVideos$.pipe(map((vs) => vs.length));

    backdrop$ = this.media$.pipe(
        map((media) => (media as Movie | TvSeries).backdrop_path),
    );

    hasBackdrop$ = this.images$.pipe(
        map((images) => (images.backdrops?.length ?? 0) > 0),
    );

    featuredBackdrops$: Observable<Image[]> = this.images$.pipe(
        map((images) => (images.backdrops ?? []).slice(0, 7)),
    );

    allBackdrops$: Observable<Image[]> = this.images$.pipe(
        map((images) => images.backdrops ?? []),
    );

    backdropsTotalCount$ = this.images$.pipe(
        map((images) => images.backdrops?.length ?? 0),
    );

    selectedSeason$ = this.select((state) => state.selectedSeason);

    seasonEpisodes$ = combineLatest([
        this.select((state) => state.seasons),
        this.selectedSeason$,
    ]).pipe(
        map(
            ([seasons, selected]) =>
                seasons.find((s) => s.season_number === selected)?.episodes ??
                [],
        ),
    );

    seasonEpisodesCount$ = this.seasonEpisodes$.pipe(
        map((episodes) => episodes.length),
    );

    latestSeason$ = this.select((state) => state.seasons).pipe(
        map(
            (seasons) =>
                [...seasons]
                    .filter((s) => (s.season_number ?? 0) > 0)
                    .sort(
                        (a, b) =>
                            (b.season_number ?? 0) - (a.season_number ?? 0),
                    )
                    .find((season) => season.episodes?.length ?? 0 > 0) ?? null,
        ),
    );

    latestSeasonPreviewEpisodes$ = this.latestSeason$.pipe(
        map((season) =>
            [...(season?.episodes ?? [])]
                .sort(
                    (a, b) => (b.episode_number ?? 0) - (a.episode_number ?? 0),
                )
                .slice(0, 3),
        ),
    );

    seasonPillOptions$ = this.select((state) => state.seasons).pipe(
        map((seasons) =>
            seasons
                .filter((s) => (s.season_number ?? 0) > 0)
                .map((s) => ({
                    label: s.name ?? `Season ${s.season_number}`,
                    value: s.season_number,
                })),
        ),
    );

    topRatedEpisode$ = this.select((state) => state.seasons).pipe(
        map((seasons) =>
            seasons
                .flatMap((s) => s.episodes ?? [])
                .reduce(
                    (best, ep) =>
                        (ep.vote_average ?? 0) > (best?.vote_average ?? 0)
                            ? ep
                            : best,
                    null as TvEpisode | null,
                ),
        ),
    );

    latestEpisode$ = this.latestSeason$.pipe(
        map(
            (season) =>
                [...(season?.episodes ?? [])].sort(
                    (a, b) => (b.episode_number ?? 0) - (a.episode_number ?? 0),
                )[0] ?? null,
        ),
    );

    lists$: Observable<MovieListItemForList[]> = this.select(
        (state) => state.lists ?? [],
    );

    viewModel$: Observable<MediaViewModel> = combineLatest([
        this.media$,
        this.type$,
        this.configStoreService.languages$,
    ]).pipe(
        map(([media, type, languages]) =>
            this.toViewModel(media, type, languages),
        ),
    );
    title$ = this.viewModel$.pipe(map((vm) => vm.title));

    allPhotos$: Observable<ViewerImage[]> = this.images$.pipe(
        map((images) => [
            ...(images.backdrops ?? []),
            ...(images.posters ?? []),
            ...(images.logos ?? []),
        ]),
    );

    featuredPhotos$ = this.allPhotos$.pipe(map((photos) => photos.slice(0, 7)));
    photosTotalCount$ = this.allPhotos$.pipe(
        map((allPhotos) => allPhotos.length),
    );

    constructor(
        private movieRestControllerService: MovieRestControllerService,
        private tvSeriesRestControllerService: TvSeriesRestControllerService,
        private tvSeasonRestControllerService: TvSeasonRestControllerService,
        private collectionRestControllerService: CollectionRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
        private configStoreService: ConfigStoreService,
        private router: Router,
    ) {
        super({
            seasons: [],
            type: '',
        });
    }

    updateSelectedSeason(seasonNumber: number): void {
        this.patchState({ selectedSeason: seasonNumber });
    }

    getLists$(id: number, type: string): Observable<MovieListItemForList[]> {
        return iif(
            () => type === 'tv',
            this.tvSeriesRestControllerService.listsCopy(
                id,
                undefined,
                undefined,
                undefined,
                undefined,
                { httpHeaderAccept: 'application/json' },
            ),
            this.movieRestControllerService.movieLists(
                id,
                undefined,
                undefined,
                undefined,
                undefined,
                { httpHeaderAccept: 'application/json' },
            ),
        ).pipe(
            map((page) => page.results ?? []),
            tap((lists) => this.patchState({ lists })),
            catchError(() => {
                this.patchState({ lists: [] });
                return EMPTY;
            }),
        );
    }

    getDetails$(id: number, type: string) {
        this.patchState({ type });

        return combineLatest([
            this.detailsRequest$(id, type).pipe(
                loader(this.ngxUiLoaderService),
                catchError(() => {
                    this.router.navigate(['not-found']);
                    return EMPTY;
                }),
                tap((data) =>
                    this.patchState({ media: data as MediaEnriched }),
                ),
                switchMap((data) => {
                    if (type === 'tv') {
                        return this.fetchSeasons$(data as TvSeries).pipe(
                            tap((seasons) => this.patchState({ seasons })),
                        );
                    }
                    return EMPTY;
                }),
            ),
        ]);
    }

    private get images$() {
        return this.media$.pipe(
            map((m) => m.images),
            filter(isDefined),
        );
    }

    private get type$() {
        return this.select((state) => state.type);
    }

    private toViewModel(
        media: Movie | TvSeries,
        type: string,
        languages: Language[],
    ): MediaViewModel {
        const isTV = type === 'tv';
        const tv = isTV ? (media as TvSeries) : undefined;
        const movie = isTV ? undefined : (media as Movie);

        const langCodes = isTV
            ? (tv!.languages ?? [])
            : [movie!.original_language ?? ''].filter(Boolean);

        const resolvedLanguages = languages.length
            ? langCodes.map(
                  (code) =>
                      languages.find((l) => l.iso_639_1 === code)
                          ?.english_name ?? code,
              )
            : langCodes;

        const dateStr = isTV ? tv!.first_air_date : movie!.release_date;

        return {
            id: media.id!,
            title: isTV ? (tv!.name ?? '') : (movie!.title ?? ''),
            year: dateStr ? dateStr.substring(0, 4) : '',
            overview: media.overview ?? '',
            genres: media.genres ?? [],
            voteAverage: media.vote_average ?? 0,
            posterPath: media.poster_path ?? null,
            backdropPath: media.backdrop_path ?? null,
            status: media.status,
            languages: resolvedLanguages,
            mediaType: isTV ? 'tv' : 'movie',

            releaseDate: movie?.release_date,
            runtime: movie?.runtime,
            budget: movie?.budget,
            revenue: movie?.revenue,

            firstAirDate: tv?.first_air_date,
            lastAirDate: tv?.last_air_date,
            creators: tv?.created_by,
            numberOfSeasons: tv?.number_of_seasons,
            numberOfEpisodes: tv?.number_of_episodes,
            networks: tv?.networks,
        };
    }

    private fetchSeasons$(tvSeries: TvSeries) {
        return forkJoin(
            (tvSeries.seasons ?? []).map((season) =>
                this.fetchSeason$(tvSeries.id!, season.season_number!).pipe(
                    tap((s) => {
                        if (s.season_number === 1) {
                            this.updateSelectedSeason(s.season_number!);
                        }
                    }),
                ),
            ),
        );
    }

    private fetchSeason$(seriesId: number, seasonNumber: number) {
        return this.tvSeasonRestControllerService.tvSeasonDetails(
            seriesId,
            seasonNumber,
            undefined,
            undefined,
            undefined,
            undefined,
            { httpHeaderAccept: 'application/json' },
        );
    }

    private detailsRequest$(
        id: number,
        type: string,
    ): Observable<Movie | TvSeries> {
        return iif(
            () => type === 'tv',
            this.tvSeriesRestControllerService.tvSeriesDetails(
                id,
                'credits,videos,similar,external_ids,images,aggregate_credits',
                undefined,
                undefined,
                undefined,
                { httpHeaderAccept: 'application/json' },
            ),
            this.movieRestControllerService.movieDetails(
                id,
                'credits,videos,similar,external_ids,images',
                undefined,
                undefined,
                undefined,
                { httpHeaderAccept: 'application/json' },
            ),
        );
    }
}
