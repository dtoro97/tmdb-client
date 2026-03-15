import { DividerModule } from 'primeng/divider';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ExternalIds, Movie, Person, TvSeries } from '../../../api';

@Component({
  selector: 'app-social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DividerModule],
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
})
export class SocialLinksComponent {
  @Input() isPerson: boolean;
  @Input() links: ExternalIds;
  @Input() item: TvSeries | Movie | Person;
}
