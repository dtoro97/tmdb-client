import { Component, Input } from '@angular/core';

import { ImagePipe } from '../../pipes/image.pipe';
import { RouterLink } from '@angular/router';
import { CastMember } from '../../../api';

@Component({
  selector: 'app-person-card',
  imports: [ImagePipe, RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent {
  @Input() person: CastMember;
}
