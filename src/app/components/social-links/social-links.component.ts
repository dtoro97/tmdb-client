import { DividerModule } from 'primeng/divider';
import {
  ExternalIds,
  MovieDetails,
  PersonDetails,
  TvShowDetails,
} from 'tmdb-ts';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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
  @Input() item: TvShowDetails | MovieDetails | PersonDetails;
}
