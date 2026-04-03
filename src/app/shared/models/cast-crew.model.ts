import { CastMember, CrewMember } from '../../api';

export type CastGridMember = CastMember & {
    episode_count?: number;
};

export type CrewGridMember = CrewMember & {
    episode_count?: number;
};

export interface GroupedCrew {
    department: string;
    members: CrewGridMember[];
}
