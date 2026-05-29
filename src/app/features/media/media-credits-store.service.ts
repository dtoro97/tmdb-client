import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, map, of, take, tap } from 'rxjs';

import { AggregateCastMember, AggregateCredits, AggregateCrewMember, Credits } from '../../api';
import { PAGE_SIZE } from '../../constants';
import {
    CastGridMember,
    CrewGridMember,
    PersonCardItem,
    RemoteData,
    remoteData,
    toCastPersonCardItem,
} from '../../shared';
import { MediaApiService } from './media-api.service';
import { MediaTarget, isSameMediaTarget } from './media-target';

export interface MediaCreditsResource {
    readonly cast: CastGridMember[];
    readonly crew: CrewGridMember[];
}

interface MediaCreditsState {
    readonly target: MediaTarget | null;
    readonly credits: RemoteData<MediaCreditsResource>;
}

type MediaCreditsResponse = Credits | AggregateCredits | null;

const EMPTY_CREDITS: MediaCreditsResource = {
    cast: [],
    crew: [],
};

const INITIAL_STATE: MediaCreditsState = {
    target: null,
    credits: { state: 'notAsked' },
};

@Injectable()
export class MediaCreditsStoreService extends ComponentStore<MediaCreditsState> {
    readonly creditsState$ = this.select((state) => state.credits);

    readonly castCrew$ = this.creditsState$.pipe(map((state) => remoteData(state, EMPTY_CREDITS)));

    readonly cast$ = this.castCrew$.pipe(map((credits) => credits.cast));

    readonly crew$ = this.castCrew$.pipe(map((credits) => credits.crew));

    readonly topCastState$ = this.creditsState$.pipe(map((state) => this.toTopCastState(state)));

    constructor(private readonly mediaApiService: MediaApiService) {
        super(INITIAL_STATE);
    }

    load$(target: MediaTarget): Observable<MediaCreditsResource> {
        const state = this.get();

        if (isSameMediaTarget(state.target, target)) {
            if (state.credits.state === 'success') {
                return of(state.credits.data);
            }

            if (state.credits.state === 'loading') {
                return this.creditsReady$();
            }
        }

        this.setState({
            ...INITIAL_STATE,
            target,
            credits: { state: 'loading' },
        });

        const request$: Observable<MediaCreditsResponse> =
            target.type === 'tv'
                ? this.mediaApiService.getTvCredits$(target.id)
                : this.mediaApiService.getMovieCredits$(target.id);

        return request$.pipe(
            map((credits) => this.toCreditsResource(credits, target.type)),
            tap((credits) => {
                this.patchState({ credits: { state: 'success', data: credits } });
            }),
            catchError(() => {
                this.patchState({ credits: { state: 'success', data: EMPTY_CREDITS } });
                return of(EMPTY_CREDITS);
            }),
        );
    }

    private creditsReady$(): Observable<MediaCreditsResource> {
        return this.creditsState$.pipe(
            filter((state): state is Extract<RemoteData<MediaCreditsResource>, { state: 'success' }> =>
                state.state === 'success',
            ),
            take(1),
            map((state) => state.data),
        );
    }

    private toTopCastState(state: RemoteData<MediaCreditsResource>): RemoteData<PersonCardItem[]> {
        switch (state.state) {
            case 'success':
                return { state: 'success', data: this.toTopCast(state.data.cast) };
            case 'loading-more':
                return { state: 'loading-more', data: this.toTopCast(state.data.cast) };
            case 'failure':
                return { state: 'failure', error: state.error };
            default:
                return { state: state.state };
        }
    }

    private toTopCast(cast: CastGridMember[]): PersonCardItem[] {
        return cast.slice(0, PAGE_SIZE).map(toCastPersonCardItem);
    }

    private toCreditsResource(credits: MediaCreditsResponse, mediaType: MediaTarget['type']): MediaCreditsResource {
        if (mediaType === 'tv') {
            const tvCredits = credits as AggregateCredits | null;
            return this.toTvCredits(tvCredits?.cast ?? [], tvCredits?.crew ?? []);
        }

        const movieCredits = credits as Credits | null;
        return this.toMovieCredits(movieCredits?.cast ?? [], movieCredits?.crew ?? []);
    }

    private toMovieCredits(cast: CastGridMember[], crew: CrewGridMember[]): MediaCreditsResource {
        return {
            cast,
            crew,
        };
    }

    private toTvCredits(cast: AggregateCastMember[], crew: AggregateCrewMember[]): MediaCreditsResource {
        return {
            cast: cast.map((member) => this.toAggregateCastMember(member)),
            crew: crew.map((member) => this.toAggregateCrewMember(member)),
        };
    }

    private toAggregateCastMember(member: AggregateCastMember): CastGridMember {
        const characters = [...new Set((member.roles ?? []).map((role) => role.character).filter(Boolean))];

        return {
            adult: member.adult,
            gender: member.gender,
            id: member.id,
            known_for_department: member.known_for_department,
            name: member.name,
            original_name: member.original_name,
            popularity: member.popularity,
            profile_path: member.profile_path,
            order: member.order,
            character: characters.join(', '),
            episode_count: member.total_episode_count,
        };
    }

    private toAggregateCrewMember(member: AggregateCrewMember): CrewGridMember {
        const jobs = [...new Set((member.jobs ?? []).map((job) => job.job).filter(Boolean))];

        return {
            adult: member.adult,
            gender: member.gender,
            id: member.id,
            known_for_department: member.known_for_department,
            name: member.name,
            original_name: member.original_name,
            popularity: member.popularity,
            profile_path: member.profile_path,
            department: member.department,
            job: jobs.join(', '),
            episode_count: member.total_episode_count,
        };
    }
}
