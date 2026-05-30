import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageComponent, RepeatPipe, SkeletonComponent } from '../../../shared';
import { CastGridMember, GroupedCrew } from '../models/cast-crew.model';

type CastCrewGridVariant = 'accordion' | 'directory';

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
    @Input() variant: CastCrewGridVariant = 'accordion';
}
