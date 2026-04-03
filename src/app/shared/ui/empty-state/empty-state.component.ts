import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
    @Input({ required: true }) iconClass = '';
    @Input({ required: true }) text = '';
    @Input() title?: string;
    @Input() iconStyle: 'badge' | 'plain' = 'badge';
}
