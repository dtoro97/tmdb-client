import { DividerModule } from 'primeng/divider';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  MovieDetails200Response,
  MovieExternalIds200Response,
  PersonDetails200Response,
  TvSeriesDetails200Response,
} from '../../api';

@Component({
  selector: 'app-social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DividerModule],
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
})
export class SocialLinksComponent {
  @Input() isPerson: boolean;
  @Input() links: MovieExternalIds200Response;
  @Input() item:
    | TvSeriesDetails200Response
    | MovieDetails200Response
    | PersonDetails200Response;
}
