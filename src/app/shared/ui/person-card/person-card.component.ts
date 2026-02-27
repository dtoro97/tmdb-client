import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CastMember } from '../../../api';
import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

@Component({
    selector: 'app-person-card',
    imports: [MediaThumbComponent, RouterLink],
    templateUrl: './person-card.component.html',
    styleUrl: './person-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCardComponent {
    @Input() person: CastMember;
}
