import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CastGridMember, GroupedCrew, ImageComponent, RepeatPipe, SkeletonComponent } from '../../../shared';

@Component({
    selector: 'app-cast-crew-grid',
    imports: [CdkAccordionModule, RouterLink, ImageComponent, RepeatPipe, SkeletonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cast-crew-grid.component.html',
    styleUrl: './cast-crew-grid.component.scss',
})
export class CastCrewGridComponent {
    readonly defaultExpandedGroupCount = 3;
    readonly loadingRowCount = 5;
    @Input() cast: CastGridMember[] = [];
    @Input() groupedCrew: GroupedCrew[] = [];
    @Input() showCast = true;
    @Input() showCrew = true;
    @Input() loading = false;
}
