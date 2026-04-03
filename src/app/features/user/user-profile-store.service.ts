import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';

import { MultiListItem, TrendingRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import {
    CardItem,
    LoadableItems,
    LoadableValue,
    LocaleStoreService,
    TmdbUserAccountService,
    UserAccountProfile,
    UserSessionMode,
    UserSessionStoreService,
    loaded,
    toCardItem,
    toUserAccountProfile,
} from '../../shared';

interface UserProfileState {
    mode: UserSessionMode;
    profileState: LoadableValue<UserAccountProfile>;
    trendingSuggestionsState: LoadableItems<CardItem>;
}

export interface UserProfileVm {
    readonly mode: UserSessionMode;
    readonly profileState: LoadableValue<UserAccountProfile>;
    readonly profileDisplayName: string;
    readonly profileAvatarInitials: string;
    readonly profileMetaLine: string | null;
    readonly trendingSuggestionsState: LoadableItems<CardItem>;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

const toProfileDisplayName = (
    profileState: LoadableValue<UserAccountProfile>,
): string => {
    if (profileState.type !== 'loaded') {
        return 'TMDb Member';
    }

    return (
        profileState.value.name ?? profileState.value.username ?? 'TMDb Member'
    );
};

const toAvatarInitials = (
    profileState: LoadableValue<UserAccountProfile>,
): string => {
    if (profileState.type !== 'loaded') {
        return 'TM';
    }

    const source = (
        profileState.value.name ??
        profileState.value.username ??
        'TMDb Member'
    ).trim();

    const words = source.split(/\s+/).filter(Boolean);
    const initials = words
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '');

    return initials.join('') || 'TM';
};

const toProfileMetaLine = (
    profileState: LoadableValue<UserAccountProfile>,
): string | null => {
    if (profileState.type !== 'loaded') {
        return null;
    }

    const parts: string[] = [];
    const lang = profileState.value.language?.trim();
    const region = profileState.value.region?.trim().toUpperCase();

    if (lang) {
        const resolved = languageNames.of(lang);
        parts.push(`Language: ${resolved ?? lang.toUpperCase()}`);
    }

    if (region) {
        const resolved = regionNames.of(region);
        parts.push(`Region: ${resolved ?? region}`);
    }

    return parts.length ? parts.join(' · ') : null;
};

const INITIAL_STATE: UserProfileState = {
    mode: 'anonymous',
    profileState: { type: 'idle' },
    trendingSuggestionsState: { type: 'idle' },
};

@Injectable()
export class UserProfileStore extends ComponentStore<UserProfileState> {
    readonly vm$ = this.select(
        (state): UserProfileVm => ({
            mode: state.mode,
            profileState: state.profileState,
            profileDisplayName: toProfileDisplayName(state.profileState),
            profileAvatarInitials: toAvatarInitials(state.profileState),
            profileMetaLine: toProfileMetaLine(state.profileState),
            trendingSuggestionsState: state.trendingSuggestionsState,
        }),
    );

    constructor(
        private readonly localeStore: LocaleStoreService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly trendingService: TrendingRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$(): Observable<void> {
        const mode = this.userSessionStore.mode();

        if (mode !== 'user') {
            this.patchState({
                ...INITIAL_STATE,
                mode,
            });
            return of(undefined);
        }

        this.patchState({
            mode,
            profileState: { type: 'loading' },
            trendingSuggestionsState: { type: 'loading' },
        });

        const language = this.localeStore.language();

        return forkJoin({
            profile: this.tmdbUserAccountService.getSessionAccountDetails$(),
            trending: this.trendingService
                .trendingAll('day', language, 'body', false, API_JSON_OPTIONS)
                .pipe(catchError(() => of({ results: [] as MultiListItem[] }))),
        }).pipe(
            tap((result) => {
                this.patchState({
                    profileState: {
                        type: 'loaded',
                        value: toUserAccountProfile(result.profile),
                    },
                    trendingSuggestionsState: loaded(
                        (result.trending.results ?? [])
                            .filter(
                                (item: MultiListItem) =>
                                    item.media_type === 'movie' ||
                                    item.media_type === 'tv',
                            )
                            .map((item: MultiListItem) =>
                                item.media_type === 'movie'
                                    ? toCardItem(item, 'movie')
                                    : toCardItem(item, 'tv'),
                            )
                            .slice(0, 16),
                    ),
                });
            }),
            map(() => undefined),
            catchError((error) => {
                this.patchState({
                    profileState: { type: 'idle' },
                    trendingSuggestionsState: loaded([]),
                });
                throw error;
            }),
        );
    }
}
