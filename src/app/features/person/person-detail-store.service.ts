import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import type { Person, PersonExternalIds, PersonImages, TaggedImagePage } from '../../api';
import {
    PersonCombinedCastCredit,
    PersonCombinedCredits,
    PersonCombinedCrewCredit,
    PersonRestControllerService,
} from '../../api';
import { EMPTY, catchError, delay, map, of, switchMap, tap } from 'rxjs';
import {
    CardItem,
    ExternalLinks,
    LoadableItems,
    LoadableValue,
    LocaleStoreService,
    MediaType,
    SortDirection,
    ViewerImage,
    buildExternalLinks,
    shuffle,
} from '../../shared';
import { API_JSON_OPTIONS, CAROUSEL_COUNT, MAX_VISIBLE_PHOTOS } from '../../constants';

export type CreditItemKind = 'cast' | 'production' | 'mixed';

export interface CreditItem {
    id: number;
    title: string;
    mediaType: MediaType;
    kind: CreditItemKind;
    releaseDate: string | null;
    rating: number | null;
    voteCount: number;
    posterPath: string | null;
    backdropPath: string | null;
    character?: string;
    job?: string;
    episodeCount?: number;
}

export interface PersonCreditsDisplayItemVm extends CreditItem {
    roleLabel: string | null;
    mediaTypeLabel: string;
    episodeLabel: string | null;
}

export interface PersonWithExternalIds extends Person {
    external_ids?: PersonExternalIds;
    images?: PersonImages;
    tagged_images?: TaggedImagePage;
}

export interface PersonCreditsVm {
    cast: CreditItem[];
    production: CreditItem[];
}

export type PersonCreditsSection = 'all' | 'cast' | 'production';
export type PersonCreditsMediaType = 'all' | MediaType;
export type PersonCreditsSortBy = 'date' | 'rating' | 'title';

export interface PersonCreditsUiState {
    section: PersonCreditsSection;
    mediaType: PersonCreditsMediaType;
    sortBy: PersonCreditsSortBy;
    sortDirection: SortDirection;
}

export interface PersonCreditsGroupVm {
    year: string;
    movieCount: number;
    tvCount: number;
    items: PersonCreditsDisplayItemVm[];
}

export interface PersonCreditsDisplayVm {
    totalCount: number;
    groups: PersonCreditsGroupVm[];
}

export interface PersonDetailVm {
    person: LoadableValue<PersonWithExternalIds | null>;
    externalLinks: ExternalLinks | null;
    knownFor: LoadableItems<CardItem>;
    photos: LoadableItems<ViewerImage>;
    credits: LoadableValue<PersonCreditsVm>;
    creditsUi: PersonCreditsUiState;
    creditsDisplay: LoadableValue<PersonCreditsDisplayVm>;
}

interface PersonDetailState {
    person: LoadableValue<PersonWithExternalIds | null>;
    photos: LoadableItems<ViewerImage>;
    credits: LoadableValue<PersonCreditsVm>;
    creditsUi: PersonCreditsUiState;
}

const INITIAL_CREDITS_UI: PersonCreditsUiState = {
    section: 'all',
    mediaType: 'all',
    sortBy: 'date',
    sortDirection: 'desc',
};

const INITIAL_STATE: PersonDetailState = {
    person: { type: 'idle' },
    photos: { type: 'idle' },
    credits: { type: 'idle' },
    creditsUi: INITIAL_CREDITS_UI,
};

@Injectable()
export class PersonDetailStoreService extends ComponentStore<PersonDetailState> {
    personDetailVm$ = this.select(
        (state): PersonDetailVm => ({
            person: state.person,
            externalLinks: buildPersonExternalLinks(state.person),
            knownFor: buildKnownFor(state.person, state.credits),
            photos: state.photos,
            credits: state.credits,
            creditsUi: state.creditsUi,
            creditsDisplay: buildCreditsDisplay(state.credits, state.creditsUi),
        }),
    );

    constructor(
        private personRestControllerService: PersonRestControllerService,
        private localStore: LocaleStoreService,
        private router: Router,
    ) {
        super(INITIAL_STATE);
    }

    getPersonDetails$(id: number) {
        const state = this.get();
        if (
            state.person.type === 'loaded' &&
            state.person.value?.id === id &&
            state.photos.type === 'loaded' &&
            state.credits.type === 'loaded'
        ) {
            return of(undefined);
        }

        this.patchState({
            person: { type: 'loading' },
            photos: { type: 'loading' },
            credits: { type: 'loading' },
            creditsUi: INITIAL_CREDITS_UI,
        });

        return this.personRestControllerService
            .personDetails(id, 'external_ids,images,tagged_images', undefined, undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                delay(1000),
                map((person) => person as PersonWithExternalIds),
                tap((person) => {
                    this.patchState({
                        person: { type: 'loaded', value: person },
                    });

                    this.patchPhotosFromPerson(person);
                }),
                switchMap(() => this.loadCredits$(id)),
                catchError(() => {
                    this.router.navigate(['not-found']);
                    return EMPTY;
                }),
            );
    }

    private loadCredits$(id: number) {
        return this.personRestControllerService
            .personCombinedCredits(String(id), undefined, undefined, undefined, API_JSON_OPTIONS)
            .pipe(
                catchError(() => of({ cast: [], crew: [] } as PersonCombinedCredits)),
                tap((raw) => {
                    this.patchState({
                        credits: {
                            type: 'loaded',
                            value: {
                                cast: buildCastCredits(raw.cast ?? []),
                                production: buildProductionCredits(raw.crew ?? []),
                            },
                        },
                    });
                }),
                map(() => undefined),
            );
    }

    private patchPhotosFromPerson(person: PersonWithExternalIds): void {
        const tagged = person.tagged_images?.results ?? [];
        const profiles = person.images?.profiles ?? [];
        const images = [
            ...profiles.map(
                (img): ViewerImage => ({
                    ...img,
                    photoType: 'profile',
                }),
            ),
            ...tagged.map(
                (img): ViewerImage => ({
                    file_path: img.file_path,
                    aspect_ratio: img.aspect_ratio,
                    height: img.height,
                    width: img.width,
                    vote_average: img.vote_average,
                    vote_count: img.vote_count,
                    iso_639_1: img.iso_639_1,
                    caption:
                        (img.media as { title?: string; name?: string })?.title ??
                        (img.media as { name?: string })?.name,
                    photoType: 'tagged',
                }),
            ),
        ];
        this.patchState({
            photos: {
                type: 'loaded',
                value: shuffle(images),
            },
        });
    }

    setCreditsSection(section: PersonCreditsSection): void {
        this.patchState((state) => ({
            ...state,
            creditsUi: {
                ...state.creditsUi,
                section,
            },
        }));
    }

    setCreditsMediaType(mediaType: PersonCreditsMediaType): void {
        this.patchState((state) => ({
            ...state,
            creditsUi: {
                ...state.creditsUi,
                mediaType,
            },
        }));
    }

    setCreditsSortBy(sortBy: PersonCreditsSortBy): void {
        this.patchState((state) => ({
            ...state,
            creditsUi: {
                ...state.creditsUi,
                sortBy,
            },
        }));
    }

    resetCreditsFilters(): void {
        this.patchState((state) => ({
            ...state,
            creditsUi: {
                ...INITIAL_CREDITS_UI,
            },
        }));
    }

    toggleCreditsSortDirection(): void {
        this.patchState((state) => ({
            ...state,
            creditsUi: {
                ...state.creditsUi,
                sortDirection: state.creditsUi.sortDirection === 'desc' ? 'asc' : 'desc',
            },
        }));
    }
}

const toCastCreditItem = (credit: PersonCombinedCastCredit): CreditItem => ({
    id: credit.id!,
    title: credit.title || credit.name || '',
    kind: 'cast',
    character: credit.character,
    mediaType: (credit.media_type as MediaType) ?? 'movie',
    releaseDate: credit.release_date || credit.first_air_date || null,
    rating: credit.vote_average ?? null,
    voteCount: credit.vote_count ?? 0,
    posterPath: credit.poster_path ?? null,
    backdropPath: credit.backdrop_path ?? null,
    episodeCount: credit.media_type === 'tv' ? credit.episode_count : undefined,
});

const toProductionCreditItem = (credit: PersonCombinedCrewCredit): CreditItem => ({
    id: credit.id!,
    title: credit.title || credit.name || '',
    kind: 'production',
    job: credit.job,
    mediaType: (credit.media_type as MediaType) ?? 'movie',
    releaseDate: credit.release_date || credit.first_air_date || null,
    rating: credit.vote_average ?? null,
    voteCount: credit.vote_count ?? 0,
    posterPath: credit.poster_path ?? null,
    backdropPath: credit.backdrop_path ?? null,
    episodeCount: credit.media_type === 'tv' ? credit.episode_count : undefined,
});

const mergeText = (a?: string, b?: string): string | undefined => {
    const parts = [a, b].filter((v): v is string => !!v?.trim());
    return parts.length ? [...new Set(parts)].join(', ') : undefined;
};

const buildCreditRoleLabel = (item: Pick<CreditItem, 'character' | 'job'>) =>
    mergeText(item.character, item.job) ?? null;

const sortCredits = (a: CreditItem, b: CreditItem): number =>
    (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '') || a.title.localeCompare(b.title);

const mergeById = <T extends { id?: number }>(items: T[], merge: (existing: T, incoming: T) => T): T[] => {
    const byId = new Map<number, T>();

    for (const item of items) {
        const id = item.id;
        if (!id) {
            continue;
        }

        const existing = byId.get(id);
        if (!existing) {
            byId.set(id, item);
            continue;
        }

        byId.set(id, merge(existing, item));
    }

    return [...byId.values()];
};

const buildCastCredits = (items: PersonCombinedCastCredit[]): CreditItem[] => {
    const merged = mergeById(items, (existing, incoming) => ({
        ...existing,
        episode_count: Math.max(existing.episode_count ?? 0, incoming.episode_count ?? 0),
        character: mergeText(existing.character, incoming.character),
    }));

    return merged.map(toCastCreditItem).sort(sortCredits);
};

const buildProductionCredits = (items: PersonCombinedCrewCredit[]): CreditItem[] => {
    const merged = mergeById(items, (existing, incoming) => ({
        ...existing,
        episode_count: Math.max(existing.episode_count ?? 0, incoming.episode_count ?? 0),
        job: mergeText(existing.job, incoming.job),
    }));

    return merged.map(toProductionCreditItem).sort(sortCredits);
};

const buildKnownFor = (
    person: LoadableValue<PersonWithExternalIds | null>,
    credits: LoadableValue<PersonCreditsVm>,
): LoadableItems<CardItem> => {
    if (person.type === 'loading' || credits.type === 'loading') {
        return { type: 'loading' };
    }

    if (person.type !== 'loaded' || credits.type !== 'loaded' || !person.value) {
        return { type: 'idle' };
    }

    const seed = person.value.known_for_department === 'Acting' ? credits.value.cast : credits.value.production;

    const cards: CardItem[] = [...seed]
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, CAROUSEL_COUNT * 2)
        .map((c) => ({
            id: c.id,
            mediaType: c.mediaType,
            title: c.title,
            imagePath: c.posterPath,
            backdropPath: c.backdropPath,
            rating: c.rating,
            date: c.releaseDate ?? '',
            overview: '',
            role: buildCreditRoleLabel(c) ?? undefined,
        }));

    return { type: 'loaded', value: cards };
};

const buildPersonExternalLinks = (person: LoadableValue<PersonWithExternalIds | null>): ExternalLinks | null => {
    if (person.type !== 'loaded' || !person.value) {
        return null;
    }

    return buildExternalLinks(person.value.external_ids ?? null, person.value.homepage ?? null, 'name');
};
const mergeCreditsForAllSection = (items: CreditItem[]): CreditItem[] => {
    const byKey = new Map<string, CreditItem>();

    for (const item of items) {
        const key = `${item.mediaType}-${item.id}`;
        const existing = byKey.get(key);

        if (!existing) {
            byKey.set(key, item);
            continue;
        }

        const mergedCharacter = mergeText(existing.character, item.character);
        const mergedJob = mergeText(existing.job, item.job);

        byKey.set(key, {
            ...existing,
            kind: mergedCharacter && mergedJob ? 'mixed' : mergedCharacter ? 'cast' : 'production',
            character: mergedCharacter,
            job: mergedJob,
            episodeCount: Math.max(existing.episodeCount ?? 0, item.episodeCount ?? 0),
            rating: (existing.voteCount ?? 0) >= (item.voteCount ?? 0) ? existing.rating : item.rating,
            voteCount: Math.max(existing.voteCount ?? 0, item.voteCount ?? 0),
            posterPath: existing.posterPath ?? item.posterPath,
            backdropPath: existing.backdropPath ?? item.backdropPath,
        });
    }

    return [...byKey.values()];
};

const getSortableDate = (value: string | null): string => {
    if (!value?.trim()) {
        return '';
    }

    return value;
};

const compareCreditsBySort = (left: CreditItem, right: CreditItem, sortBy: PersonCreditsSortBy): number => {
    if (sortBy === 'title') {
        return left.title.localeCompare(right.title);
    }

    if (sortBy === 'rating') {
        return (
            (left.rating ?? -1) - (right.rating ?? -1) ||
            left.voteCount - right.voteCount ||
            left.title.localeCompare(right.title)
        );
    }

    return (
        getSortableDate(left.releaseDate).localeCompare(getSortableDate(right.releaseDate)) ||
        left.title.localeCompare(right.title)
    );
};

const buildCreditsDisplay = (
    credits: LoadableValue<PersonCreditsVm>,
    ui: PersonCreditsUiState,
): LoadableValue<PersonCreditsDisplayVm> => {
    if (credits.type === 'loading') {
        return { type: 'loading' };
    }

    if (credits.type !== 'loaded') {
        return { type: 'idle' };
    }

    const source =
        ui.section === 'all'
            ? [...credits.value.cast, ...credits.value.production]
            : ui.section === 'cast'
              ? credits.value.cast
              : credits.value.production;

    const seed = ui.section === 'all' ? mergeCreditsForAllSection(source) : source;

    const mediaFiltered = ui.mediaType === 'all' ? seed : seed.filter((item) => item.mediaType === ui.mediaType);

    const direction = ui.sortDirection === 'desc' ? -1 : 1;
    const sorted = [...mediaFiltered].sort((left, right) => compareCreditsBySort(left, right, ui.sortBy) * direction);

    const displayItems = sorted.map(
        (item): PersonCreditsDisplayItemVm => ({
            ...item,
            roleLabel: buildCreditRoleLabel(item),
            mediaTypeLabel: item.mediaType === 'tv' ? 'TV Shows' : 'Movie',
            episodeLabel: item.mediaType === 'tv' && item.episodeCount ? `${item.episodeCount} ep` : null,
        }),
    );

    const groups = new Map<string, PersonCreditsDisplayItemVm[]>();
    for (const item of displayItems) {
        const year = ui.sortBy === 'date' ? item.releaseDate?.slice(0, 4) || 'Unknown' : 'All Years';
        const existing = groups.get(year) ?? [];
        existing.push(item);
        groups.set(year, existing);
    }

    return {
        type: 'loaded',
        value: {
            totalCount: displayItems.length,
            groups: [...groups.entries()].map(([year, items]) => {
                const movieCount = items.filter((item) => item.mediaType === 'movie').length;
                const tvCount = items.filter((item) => item.mediaType === 'tv').length;

                return {
                    year,
                    movieCount,
                    tvCount,
                    items,
                };
            }),
        },
    };
};
