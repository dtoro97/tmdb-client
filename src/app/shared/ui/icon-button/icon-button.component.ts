import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export type IconButtonTone = 'neutral' | 'accent' | 'danger';

@Component({
    selector: 'app-icon-button',
    imports: [MatButtonModule, MatTooltipModule],
    templateUrl: './icon-button.component.html',
    styleUrl: './icon-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.icon-button-host--disabled]': 'disabled',
        '[class.icon-button-host--selected]': 'selected',
        '[class.icon-button-host--accent]': 'tone === "accent"',
        '[class.icon-button-host--danger]': 'tone === "danger"',
    },
})
export class IconButtonComponent {
    @Input({ required: true }) ariaLabel!: string;
    @Input() disabled = false;
    @Input() selected = false;
    @Input() title = '';
    @Input() tone: IconButtonTone = 'neutral';

    @Output() readonly onClick = new EventEmitter<void>();

    click(): void {
        if (!this.disabled) {
            this.onClick.emit();
        }
    }
}
