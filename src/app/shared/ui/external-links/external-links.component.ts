import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { ExternalLinks } from '../../models';

@Component({
    selector: 'app-external-links',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatDividerModule],
    templateUrl: './external-links.component.html',
    styleUrl: './external-links.component.scss',
})
export class ExternalLinksComponent {
    @Input() externalLinks: ExternalLinks | null = null;
}
