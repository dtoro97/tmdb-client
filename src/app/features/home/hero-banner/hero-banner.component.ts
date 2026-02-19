import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-hero-banner',
  imports: [RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item) {
      <div
        class="hero-banner"
        [style.background-image]="
          'url(https://image.tmdb.org/t/p/original' + item.backdrop_path + ')'
        "
      >
        <div class="hero-overlay">
          <div class="hero-content">
            <span class="hero-badge">Trending Now</span>
            <h1 class="hero-title">{{ item.title || item.name }}</h1>
            <div class="hero-meta">
              @if (item.vote_average > 0) {
                <span class="hero-rating">
                  <i class="fa-solid fa-star"></i>
                  {{ item.vote_average | number: '1.1-1' }}
                </span>
              }
              <span class="hero-year">
                {{ item.release_date || item.first_air_date | date: 'yyyy' }}
              </span>
              <span class="hero-type">
                {{ item.media_type === 'movie' ? 'Movie' : 'TV Show' }}
              </span>
            </div>
            <p class="hero-overview">{{ item.overview }}</p>
            <a
              class="hero-cta"
              [routerLink]="['/details', item.media_type, item.id]"
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .hero-banner {
      width: 100%;
      min-height: 500px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          to top,
          var(--p-content-background) 0%,
          color-mix(in srgb, var(--p-content-background) 60%, transparent) 20%,
          color-mix(in srgb, var(--p-content-background) 20%, transparent) 40%,
          transparent 60%
        ),
        linear-gradient(
          to right,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.6) 40%,
          rgba(0, 0, 0, 0.2) 100%
        );
      display: flex;
      align-items: flex-end;
      padding: 3rem;
    }

    .hero-content {
      max-width: 600px;
      color: #fff;
    }

    .hero-badge {
      display: inline-block;
      background: var(--p-primary-color);
      color: #fff;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.75rem 0;
      line-height: 1.15;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }

    .hero-rating {
      color: var(--p-primary-color);
      font-weight: 600;

      i {
        margin-right: 0.25rem;
      }
    }

    .hero-year,
    .hero-type {
      opacity: 0.8;
    }

    .hero-overview {
      line-height: 1.6;
      opacity: 0.85;
      margin: 0 0 1.5rem 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hero-cta {
      display: inline-block;
      background: var(--p-primary-color);
      color: #fff;
      padding: 0.7rem 1.75rem;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.85;
      }
    }

    @media screen and (max-width: 768px) {
      .hero-banner {
        min-height: 400px;
      }

      .hero-overlay {
        padding: 1.5rem;
        background:
          linear-gradient(
            to top,
            var(--p-content-background) 0%,
            color-mix(in srgb, var(--p-content-background) 60%, transparent) 15%,
            color-mix(in srgb, var(--p-content-background) 20%, transparent) 35%,
            transparent 55%
          ),
          linear-gradient(
            to top,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
      }

      .hero-title {
        font-size: 1.5rem;
      }

      .hero-overview {
        -webkit-line-clamp: 2;
        font-size: 0.875rem;
      }
    }
  `,
})
export class HeroBannerComponent {
  @Input() item: any;
}
