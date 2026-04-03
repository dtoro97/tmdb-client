import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

@Component({
    selector: 'app-stepper-input',
    templateUrl: './stepper-input.component.html',
    styleUrl: './stepper-input.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperInputComponent {
    @Input() value: number | null = null;
    @Input() step = 1;
    @Input() min = 0;
    @Input() max = 100;
    @Input() placeholder = '';
    @Input() wide = false;

    @Output() valueChanged = new EventEmitter<number | null>();

    onDecrement(): void {
        const current = this.value ?? this.max + this.step;
        const next = current - this.step;
        this.valueChanged.emit(next < this.min ? null : next);
    }

    onIncrement(): void {
        const current = this.value ?? this.min - this.step;
        const next = current + this.step;
        this.valueChanged.emit(next > this.max ? this.max : next);
    }

    onInputChange(event: Event): void {
        const raw = (event.target as HTMLInputElement).value;
        const parsed = raw ? Number.parseFloat(raw) : null;
        this.valueChanged.emit(
            parsed !== null && !Number.isNaN(parsed) ? parsed : null,
        );
    }
}
