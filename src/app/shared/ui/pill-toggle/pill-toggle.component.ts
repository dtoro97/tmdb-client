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
  @Output() selected = new EventEmitter();
  onClick(value: unknown) {
    this.selected.emit(value);
  }
}
