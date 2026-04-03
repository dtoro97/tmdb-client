import {
    AggregateCredits,
    AggregateCastMember,
    AggregateCrewMember,
} from '../../api';

import {
    CastCreditWithEpisodes,
    CrewCreditWithEpisodes,
} from './media-detail.models';

const toAggregateEpisodeCount = (
    member: AggregateCastMember | AggregateCrewMember,
): number | undefined =>
    typeof member.total_episode_count === 'number'
        ? member.total_episode_count
        : undefined;

const toPrimaryLabel = (values: string[]): string => {
    if (!values.length) {
        return '';
    }

    return values[0] + (values.length > 1 ? ` +${values.length - 1} more` : '');
};

export const toCastFromAggregate = (
    aggregateCredits: AggregateCredits,
): CastCreditWithEpisodes[] =>
    (aggregateCredits.cast ?? []).map((member) => ({
        ...member,
        character: toPrimaryLabel(
            (member.roles ?? [])
                .map((role) => role.character)
                .filter((character): character is string => !!character),
        ),
        episode_count: toAggregateEpisodeCount(member),
    })) as CastCreditWithEpisodes[];

export const toCrewFromAggregate = (
    aggregateCredits: AggregateCredits,
): CrewCreditWithEpisodes[] =>
    (aggregateCredits.crew ?? []).map((member) => {
        const jobs = [
            ...new Set(
                (member.jobs ?? [])
                    .map((job) => job.job)
                    .filter((job): job is string => !!job),
            ),
        ];

        return {
            ...member,
            job: toPrimaryLabel(jobs),
            episode_count: toAggregateEpisodeCount(member),
        } as CrewCreditWithEpisodes;
    });
