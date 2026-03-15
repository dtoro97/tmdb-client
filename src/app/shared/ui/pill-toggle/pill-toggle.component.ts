import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

@Component({
    selector: 'app-pill-toggle',
    templateUrl: './pill-toggle.component.html',
    styleUrl: './pill-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillToggleComponent {
    @Input() options: { label: string; value: unknown }[] = [];
    @Input() selectedValue: unknown;
    @Input() selectedValues: unknown[] = [];
    @Input() multiple = false;
    @Output() selected = new EventEmitter<unknown | unknown[]>();

    onClick(value: unknown) {
        if (!this.multiple) {
            this.selected.emit(value);
            return;
        }

        const next = new Set(this.selectedValues);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }

        this.selected.emit([...next]);
    }
}
