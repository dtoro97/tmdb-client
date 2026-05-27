import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, tap } from 'rxjs';

import {
    LoadableValue,
    TmdbUserAccountService,
    UserAccountProfile,
    toUserAccountProfile,
} from '../../shared';

interface UserProfileState {
    profileState: LoadableValue<UserAccountProfile>;
}

const INITIAL_STATE: UserProfileState = {
    profileState: { type: 'idle' },
};

@Injectable()
export class UserProfileStore extends ComponentStore<UserProfileState> {
    readonly userProfileVm$ = this.select((state) => {
        const displayName =
            state.profileState.type === 'loaded'
                ? (state.profileState.value.name ??
                  state.profileState.value.username ??
                  'Member')
                : 'Member';

        return {
            profileState: state.profileState,
            profileDisplayName: displayName,
        };
    });

    constructor(
        private readonly tmdbUserAccountService: TmdbUserAccountService,
    ) {
        super(INITIAL_STATE);
    }

    load$() {
        this.patchState({
            profileState: { type: 'loading' },
        });

        return this.tmdbUserAccountService.getSessionAccountDetails$().pipe(
            tap((profile) => {
                this.patchState({
                    profileState: {
                        type: 'loaded',
                        value: toUserAccountProfile(profile),
                    },
                });
            }),
            catchError((error) => {
                this.patchState(INITIAL_STATE);
                throw error;
            }),
        );
    }
}
