import { CarouselModule } from 'primeng/carousel';
import { Person } from 'tmdb-ts';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImagePipe } from '../../../shared/pipes/image.pipe';

const PEOPLE_BREAKPOINTS = [
  { breakpoint: '2000px', numVisible: 7, numScroll: 7 },
  { breakpoint: '1600px', numVisible: 6, numScroll: 6 },
  { breakpoint: '1400px', numVisible: 5, numScroll: 5 },
  { breakpoint: '1100px', numVisible: 4, numScroll: 4 },
  { breakpoint: '768px', numVisible: 3, numScroll: 3 },
  { breakpoint: '480px', numVisible: 2, numScroll: 2 },
];

@Component({
  selector: 'app-people-carousel',
  imports: [CarouselModule, RouterLink, ImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-carousel
      [value]="items"
      [numVisible]="7"
      [numScroll]="7"
      [showIndicators]="false"
      [responsiveOptions]="breakpoints"
    >
      <ng-template let-person pTemplate="item">
        <div
          class="person-item"
          [routerLink]="['/people', person.id, 'overview']"
        >
          <img
            class="person-avatar"
            [src]="person.profile_path | imgSrc"
            [alt]="person.name"
          />
          <span class="person-name">{{ person.name }}</span>
          <span class="person-dept">{{ person.known_for_department }}</span>
        </div>
      </ng-template>
    </p-carousel>
  `,
  styles: `
    .person-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.7;
      }
    }

    .person-avatar {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--p-menubar-border-color);
      margin-bottom: 0.75rem;
      background: var(--p-surface-100);
    }

    .person-name {
      font-weight: 600;
      font-size: 0.95rem;
      text-align: center;
      color: var(--p-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 160px;
    }

    .person-dept {
      font-size: 0.8rem;
      color: var(--p-text-muted-color);
      margin-top: 0.25rem;
    }

    @media screen and (max-width: 768px) {
      .person-avatar {
        width: 110px;
        height: 110px;
      }

      .person-name {
        font-size: 0.85rem;
        max-width: 120px;
      }
    }
  `,
})
export class PeopleCarouselComponent {
  @Input() items: Person[] = [];
  breakpoints = PEOPLE_BREAKPOINTS;
}
