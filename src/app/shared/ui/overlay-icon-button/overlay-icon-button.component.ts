import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-overlay-icon-button',
    imports: [MatButtonModule],
    templateUrl: './overlay-icon-button.component.html',
    styleUrl: './overlay-icon-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayIconButtonComponent {
    @Input({ required: true }) ariaLabel!: string;
    @Input() disabled = false;
    @Input() title = '';

    @Output() readonly onClick = new EventEmitter<void>();

    click(): void {
        if (!this.disabled) {
            this.onClick.emit();
        }
    }
}
