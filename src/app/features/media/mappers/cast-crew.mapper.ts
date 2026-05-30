import { CrewGridMember, GroupedCrew } from '../models/cast-crew.model';

export const groupCrewMembers = (
    members: CrewGridMember[] | null | undefined,
): GroupedCrew[] => {
    const groups = new Map<string, CrewGridMember[]>();

    for (const member of members ?? []) {
        const department = member.department ?? 'Other';

        if (!groups.has(department)) {
            groups.set(department, []);
        }

        groups.get(department)!.push(member);
    }

    return Array.from(groups.entries()).map(([department, groupedMembers]) => ({
        department,
        members: groupedMembers,
    }));
};
