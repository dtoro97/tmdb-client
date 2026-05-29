import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, tap } from 'rxjs';

import {
    RemoteData,
    TmdbUserAccountService,
    UserAccountProfile,
    toUserAccountProfile,
} from '../../shared';

interface UserProfileState {
    profileState: RemoteData<UserAccountProfile>;
}

const INITIAL_STATE: UserProfileState = {
    profileState: { state: 'notAsked' },
};

@Injectable()
export class UserProfileStore extends ComponentStore<UserProfileState> {
    readonly userProfileVm$ = this.select((state) => {
        const displayName =
            state.profileState.state === 'success'
                ? (state.profileState.data.name ??
                  state.profileState.data.username ??
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
            profileState: { state: 'loading' },
        });

        return this.tmdbUserAccountService.getSessionAccountDetails$().pipe(
            tap((profile) => {
                this.patchState({
                    profileState: {
                        state: 'success',
                        data: toUserAccountProfile(profile),
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
