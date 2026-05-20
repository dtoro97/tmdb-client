import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-icon-button',
    imports: [MatButtonModule],
    templateUrl: './icon-button.component.html',
    styleUrl: './icon-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.icon-button-host--disabled]': 'disabled',
    },
})
export class IconButtonComponent {
    @Input({ required: true }) ariaLabel!: string;
    @Input() disabled = false;

    @Output() readonly onClick = new EventEmitter<void>();

    click(): void {
        if (!this.disabled) {
            this.onClick.emit();
        }
    }
}
