import { Component, Input } from '@angular/core';
import { IPersonDetails } from '../../interfaces';

@Component({
  selector: 'app-external-ids',
  standalone: false,

  templateUrl: './external-ids.component.html',
  styleUrl: './external-ids.component.scss',
})
export class ExternalIdsComponent {
  @Input() ids: any;
  @Input() item: any;
}
