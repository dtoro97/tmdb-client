import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-page-section',
    templateUrl: './page-section.component.html',
    styleUrl: './page-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSectionComponent {
    @Input() title?: string;
    @Input() subtitle?: string;
}
