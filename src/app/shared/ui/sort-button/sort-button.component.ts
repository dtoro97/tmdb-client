import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export type SortDirection = 'asc' | 'desc';

@Component({
    selector: 'app-sort-button',
    imports: [MatSelectModule, MatIconModule],
    templateUrl: './sort-button.component.html',
    styleUrl: './sort-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortButtonComponent {
    @Input() options: { label: string; value: unknown }[] = [];
    @Input() selectedValue: unknown;
    @Input() direction: SortDirection = 'desc';
    @Output() sortChange = new EventEmitter<unknown>();
    @Output() directionToggle = new EventEmitter<void>();

    onSortChange(value: unknown): void {
        this.sortChange.emit(value);
    }

    onToggleDirection(): void {
        this.directionToggle.emit();
    }
}
