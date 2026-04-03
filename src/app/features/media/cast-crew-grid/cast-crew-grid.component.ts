import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CastGridMember, GroupedCrew, ImageComponent } from '../../../shared';

@Component({
    selector: 'app-cast-crew-grid',
    imports: [CdkAccordionModule, RouterLink, ImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cast-crew-grid.component.html',
    styleUrl: './cast-crew-grid.component.scss',
})
export class CastCrewGridComponent {
    readonly defaultExpandedGroupCount = 3;

    @Input() cast: CastGridMember[] = [];
    @Input() groupedCrew: GroupedCrew[] = [];
    @Input() showCast = true;
    @Input() showCrew = true;
}
