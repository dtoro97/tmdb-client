import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-skeleton',
    templateUrl: './skeleton.component.html',
    styleUrl: './skeleton.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
    @Input() width = '100%';
    @Input() height = '0.875rem';
    @Input() radius = '4px';
}
