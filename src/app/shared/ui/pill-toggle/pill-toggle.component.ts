import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import type { SelectOption } from '../../types';

export type PillToggleOption = SelectOption<unknown>;

interface PillToggleViewOption extends PillToggleOption {
    selected: boolean;
}

export type PillToggleVariant = 'default' | 'subtle';

@Component({
    selector: 'app-pill-toggle',
    templateUrl: './pill-toggle.component.html',
    styleUrl: './pill-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillToggleComponent implements OnChanges {
    @Input() options: PillToggleOption[] = [];
    @Input() selectedValue: unknown;
    @Input() selectedValues: unknown[] = [];
    @Input() multiple = false;
    @Input() variant: PillToggleVariant = 'default';
    @Output() selected = new EventEmitter<unknown | unknown[]>();

    viewOptions: PillToggleViewOption[] = [];

    ngOnChanges(): void {
        this.viewOptions = this.options.map((option) => ({
            ...option,
            selected: this.multiple
                ? this.selectedValues.includes(option.value)
                : this.selectedValue === option.value,
        }));
    }

    onClick(value: unknown): void {
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
