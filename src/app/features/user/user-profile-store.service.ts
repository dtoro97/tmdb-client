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
    UserSessionStoreService,
    loaded,
    toCardItem,
    toUserAccountProfile,
} from '../../shared';

interface UserProfileState {
    profileState: LoadableValue<UserAccountProfile>;
    trendingSuggestionsState: LoadableItems<CardItem>;
}

const INITIAL_STATE: UserProfileState = {
    profileState: { type: 'idle' },
    trendingSuggestionsState: { type: 'idle' },
};

@Injectable()
export class UserProfileStore extends ComponentStore<UserProfileState> {
    readonly userProfileVm$ = this.select(
        (state) => {
            const displayName =
                state.profileState.type === 'loaded'
                    ? (state.profileState.value.name ??
                      state.profileState.value.username ??
                      'TMDb Member')
                    : 'TMDb Member';

            return {
                profileState: state.profileState,
                profileDisplayName: displayName,
                profileAvatarInitials: displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase() ?? '')
                    .join('') || 'TM',
                trendingSuggestionsState: state.trendingSuggestionsState,
            };
        },
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
            this.patchState(INITIAL_STATE);
            return of(undefined);
        }

        this.patchState({
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
                                (item) =>
                                    item.media_type === 'movie' ||
                                    item.media_type === 'tv',
                            )
                            .map((item) =>
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
