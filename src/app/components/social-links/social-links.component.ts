import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  ExternalIds,
  MovieDetails,
  PersonDetails,
  TvShowDetails,
} from 'tmdb-ts';

@Component({
  selector: 'app-social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
})
export class SocialLinksComponent {
  @Input() isPerson: boolean;
  @Input() links: ExternalIds;
  @Input() item: TvShowDetails | MovieDetails | PersonDetails;
}
