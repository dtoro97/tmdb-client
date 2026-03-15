import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CastMember, CrewMember } from '../../../api';
import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

interface GroupedCrew {
    department: string;
    members: CrewMember[];
}

@Component({
    selector: 'app-cast-crew-grid',
    imports: [RouterLink, MediaThumbComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cast-crew-grid.component.html',
    styleUrl: './cast-crew-grid.component.scss',
})
export class CastCrewGridComponent {
    @Input() set cast(value: CastMember[]) {
        this._cast = value;
    }
    get cast(): CastMember[] {
        return this._cast;
    }

    @Input() set crew(value: CrewMember[]) {
        const groups = new Map<string, CrewMember[]>();
        for (const member of value) {
            const dept = member.department ?? 'Other';
            if (!groups.has(dept)) groups.set(dept, []);
            groups.get(dept)!.push(member);
        }
        this.groupedCrew = Array.from(groups.entries()).map(([department, members]) => ({
            department,
            members,
        }));
    }

    private _cast: CastMember[] = [];
    groupedCrew: GroupedCrew[] = [];
}
