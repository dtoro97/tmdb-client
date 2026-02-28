import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
    Person,
    PersonCombinedCastCredit,
    PersonCombinedCredits,
    PersonCombinedCrewCredit,
    PersonExternalIds,
    PersonImages,
    PersonRestControllerService,
    TaggedImagePage,
} from '../../api';
import { combineLatest, filter, iif, map, of, tap } from 'rxjs';
import { isDefined, IOption, loader, ViewerImage } from '../../shared';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export type PersonEnrichedWithEverything = Person & {
    combined_credits?: PersonCombinedCredits;
    external_ids?: PersonExternalIds;
    images?: PersonImages;
    tagged_images?: TaggedImagePage;
};

export interface CreditItem {
    id: number;
    title: string;
    character?: string;
    job?: string;
    mediaType: string;
    year: number | null;
    rating: number | null;
    posterPath: string | null;
    episodeCount?: number;
}

export const CREDITS_PAGE_SIZE = 10;

export interface CreditGroup {
    department: string;
    upcoming: CreditItem[];
    past: CreditItem[];
}

export interface CreditGroupView extends CreditGroup {
    pagedPast: CreditItem[];
    pastPageIndex: number;
}

export interface PersonDetailStoreState {
    person: PersonEnrichedWithEverything | undefined;
    visibleCredits: string | undefined;
    creditPageIndex: Record<string, number>;
}

@Injectable()
export class PersonDetailStoreService extends ComponentStore<PersonDetailStoreState> {
    person$ = this.select((state) => state.person).pipe(filter(isDefined));
    credits$ = this.select((state) => state.person?.combined_credits).pipe(
        filter(isDefined),
    );
    links$ = this.select((state) => state.person?.external_ids);
    heroBackdrop$ = this.person$.pipe(
        map((person) => {
            const tagged = person.tagged_images?.results ?? [];
            if (!tagged.length) return null;
            const best = tagged.reduce((a, b) =>
                (b.vote_average ?? 0) > (a.vote_average ?? 0) ? b : a,
            );
            return best.file_path ?? null;
        }),
    );
    visibleCredits$ = this.select((state) => state.visibleCredits);

    hasCredits$ = this.credits$.pipe(
        map(
            (credits) =>
                (credits?.cast && credits?.cast?.length > 0) ||
                (credits?.crew && credits.crew.length > 0),
        ),
    );

    creditsOptions$ = this.credits$.pipe(
        map((credits) => {
            const options: IOption[] = [];
            if (credits?.cast?.length) {
                options.push({ label: 'Cast', value: 'cast' });
            }
            if (credits?.crew?.length) {
                options.push({ label: 'Production', value: 'crew' });
            }
            return options;
        }),
    );

    knownFor$ = combineLatest([this.visibleCredits$, this.credits$]).pipe(
        map(([visible, credits]) => {
            const items =
                visible === 'crew'
                    ? deduplicateCrew(credits.crew ?? [])
                    : deduplicateCast(credits.cast ?? []);
            return [...items].sort(
                (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0),
            );
        }),
    );

    allPhotos$ = this.person$.pipe(
        map((person): ViewerImage[] => {
            const tagged: ViewerImage[] = (
                person.tagged_images?.results ?? []
            ).map((t) => ({
                file_path: t.file_path,
                aspect_ratio: t.aspect_ratio,
                height: t.height,
                width: t.width,
                vote_average: t.vote_average,
                vote_count: t.vote_count,
                iso_639_1: t.iso_639_1,
                caption: getMediaTitle(t.media),
            }));
            const profiles: ViewerImage[] = person.images?.profiles ?? [];
            return [...tagged, ...profiles];
        }),
    );
    featuredPhotos$ = this.allPhotos$.pipe(map((photos) => photos.slice(0, 7)));
    photosTotalCount$ = this.allPhotos$.pipe(
        map((photos) => photos?.length || 0),
    );

    groupedCredits$ = this.credits$.pipe(
        map((credits) => {
            const currentYear = new Date().getFullYear();

            const castToItem = (r: PersonCombinedCastCredit): CreditItem => {
                const dateStr = r.release_date || r.first_air_date;
                const year = dateStr ? new Date(dateStr).getFullYear() : null;
                return {
                    id: r.id!,
                    title: r.title || r.name || '',
                    character: r.character,
                    mediaType: r.media_type ?? 'movie',
                    year,
                    rating: r.vote_average ?? null,
                    posterPath: r.poster_path ?? null,
                    episodeCount: r.episode_count,
                };
            };

            const crewToItem = (r: PersonCombinedCrewCredit): CreditItem => {
                const dateStr = r.release_date || r.first_air_date;
                const year = dateStr ? new Date(dateStr).getFullYear() : null;
                return {
                    id: r.id!,
                    title: r.title || r.name || '',
                    job: r.job,
                    mediaType: r.media_type ?? 'movie',
                    year,
                    rating: r.vote_average ?? null,
                    posterPath: r.poster_path ?? null,
                    episodeCount: r.episode_count,
                };
            };

            const splitAndSort = (items: CreditItem[]) => {
                const upcoming = items
                    .filter((i) => i.year !== null && i.year >= currentYear)
                    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
                const past = items
                    .filter((i) => i.year === null || i.year < currentYear)
                    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
                return { upcoming, past };
            };

            const groups: CreditGroup[] = [];

            if (credits.cast?.length) {
                const castMap = new Map<number, CreditItem>();
                for (const r of credits.cast) {
                    const id = r.id!;
                    const item = castToItem(r);
                    if (castMap.has(id)) {
                        const existing = castMap.get(id)!;
                        if (
                            item.character &&
                            existing.character &&
                            item.character !== existing.character
                        ) {
                            castMap.set(id, {
                                ...existing,
                                character: `${existing.character}, ${item.character}`,
                            });
                        }
                    } else {
                        castMap.set(id, item);
                    }
                }
                const { upcoming, past } = splitAndSort([...castMap.values()]);
                groups.push({ department: 'Acting', upcoming, past });
            }

            if (credits.crew?.length) {
                const deptMap = new Map<string, Map<number, CreditItem>>();
                for (const r of credits.crew) {
                    const dept = r.department || 'Other';
                    if (!deptMap.has(dept)) deptMap.set(dept, new Map());
                    const deptItems = deptMap.get(dept)!;
                    const id = r.id!;
                    const item = crewToItem(r);
                    if (deptItems.has(id)) {
                        const existing = deptItems.get(id)!;
                        if (
                            item.job &&
                            existing.job &&
                            item.job !== existing.job
                        ) {
                            deptItems.set(id, {
                                ...existing,
                                job: `${existing.job}, ${item.job}`,
                            });
                        }
                    } else {
                        deptItems.set(id, item);
                    }
                }
                const sortedDepts = [...deptMap.entries()].sort((a, b) =>
                    a[0].localeCompare(b[0]),
                );
                for (const [dept, itemsMap] of sortedDepts) {
                    const { upcoming, past } = splitAndSort([
                        ...itemsMap.values(),
                    ]);
                    groups.push({ department: dept, upcoming, past });
                }
            }

            return groups;
        }),
    );

    pagedGroupedCredits$ = combineLatest([
        this.groupedCredits$,
        this.select((state) => state.creditPageIndex),
    ]).pipe(
        map(([groups, pages]): CreditGroupView[] =>
            groups.map((group) => ({
                ...group,
                pagedPast: group.past.slice(
                    (pages[group.department] ?? 0) * CREDITS_PAGE_SIZE,
                    ((pages[group.department] ?? 0) + 1) * CREDITS_PAGE_SIZE,
                ),
                pastPageIndex: pages[group.department] ?? 0,
            })),
        ),
    );

    constructor(
        private personRestControllerService: PersonRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
    ) {
        super({
            person: undefined,
            visibleCredits: 'cast',
            creditPageIndex: {},
        });
    }

    getPersonDetails$(id: number) {
        const state = this.get();
        return iif(
            () => !!state.person && state.person.id === id,
            of(state),
            this.personRestControllerService
                .personDetails(
                    id,
                    'tagged_images,combined_credits,external_ids,images',
                    undefined,
                    undefined,
                    undefined,
                    {
                        httpHeaderAccept: 'application/json',
                    },
                )
                .pipe(
                    loader(this.ngxUiLoaderService),
                    tap((person) =>
                        this.patchState({
                            person: person as PersonEnrichedWithEverything,
                            creditPageIndex: {},
                        }),
                    ),
                ),
        );
    }

    updateVisibleCredits = this.updater(
        (state, value: 'cast' | 'crew'): PersonDetailStoreState => ({
            ...state,
            visibleCredits: value,
        }),
    );

    setCreditPage = this.updater(
        (
            state,
            payload: { department: string; index: number },
        ): PersonDetailStoreState => ({
            ...state,
            creditPageIndex: {
                ...state.creditPageIndex,
                [payload.department]: payload.index,
            },
        }),
    );
}

const deduplicateCast = (
    items: PersonCombinedCastCredit[],
): PersonCombinedCastCredit[] => {
    const seen = new Map<number, PersonCombinedCastCredit>();
    for (const item of items) {
        if (!item.id) continue;
        if (seen.has(item.id)) {
            const existing = seen.get(item.id)!;
            if (
                item.character &&
                existing.character &&
                item.character !== existing.character
            ) {
                seen.set(item.id, {
                    ...existing,
                    character: `${existing.character}, ${item.character}`,
                });
            }
        } else {
            seen.set(item.id, item);
        }
    }
    return [...seen.values()];
};

const deduplicateCrew = (
    items: PersonCombinedCrewCredit[],
): PersonCombinedCrewCredit[] => {
    const seen = new Map<number, PersonCombinedCrewCredit>();
    for (const item of items) {
        if (!item.id) continue;
        if (seen.has(item.id)) {
            const existing = seen.get(item.id)!;
            if (item.job && existing.job && item.job !== existing.job) {
                seen.set(item.id, {
                    ...existing,
                    job: `${existing.job}, ${item.job}`,
                });
            }
        } else {
            seen.set(item.id, item);
        }
    }
    return [...seen.values()];
};

const getMediaTitle = (media: object | undefined): string | undefined => {
    if (!media) return undefined;
    const m = media as { title?: string; name?: string };
    return m.title ?? m.name ?? undefined;
};
