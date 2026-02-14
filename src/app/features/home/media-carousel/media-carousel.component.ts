import { CarouselModule } from 'primeng/carousel';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardComponent } from '../../../shared';
import { CAROUSEL_BREAKPOINTS } from '../../../constants';

@Component({
  selector: 'app-media-carousel',
  imports: [CarouselModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-carousel
      [value]="items"
      [numVisible]="8"
      [numScroll]="8"
      [showIndicators]="false"
      [responsiveOptions]="breakpoints"
    >
      <ng-template let-item pTemplate="item">
        <app-card [item]="item" [type]="type"></app-card>
      </ng-template>
    </p-carousel>
  `,
})
export class MediaCarouselComponent {
  @Input() items: any[] = [];
  @Input() type: string;
  breakpoints = CAROUSEL_BREAKPOINTS;
}
