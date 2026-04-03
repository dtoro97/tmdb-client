import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CastGridMember, GroupedCrew, ImageComponent } from '../../../shared';

@Component({
    selector: 'app-cast-crew-grid',
    imports: [RouterLink, ImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cast-crew-grid.component.html',
    styleUrl: './cast-crew-grid.component.scss',
})
export class CastCrewGridComponent {
    @Input() cast: CastGridMember[] = [];
    @Input() groupedCrew: GroupedCrew[] = [];
}
