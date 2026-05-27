import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
} from '@angular/core';
import {
    IsActiveMatchOptions,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

interface HeaderBrowseLink {
    readonly label: string;
    readonly routerLink: string;
    readonly queryParams?: Record<string, string>;
    readonly description?: string;
    readonly activeOptions: IsActiveMatchOptions;
}

interface HeaderBrowseGroup {
    readonly id: string;
    readonly title: string;
    readonly icon: string;
    readonly links: readonly HeaderBrowseLink[];
}

const EXACT_ACTIVE_OPTIONS: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
};

const DISCOVER_ACTIVE_OPTIONS: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
};

@Component({
    selector: 'app-header-browse-menu',
    imports: [MatIconModule, RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header-browse-menu.component.html',
    styleUrl: './header-browse-menu.component.scss',
})
export class HeaderBrowseMenuComponent {
    readonly browseGroups: readonly HeaderBrowseGroup[] = [
        {
            id: 'movies',
            title: 'Movies',
            icon: 'movie',
            links: [
                {
                    label: 'Top rated movies',
                    routerLink: '/movies/top-rated',
                    description: 'Highly rated films with a strong vote floor.',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Advanced movie search',
                    routerLink: '/discover',
                    queryParams: { type: 'movie' },
                    activeOptions: DISCOVER_ACTIVE_OPTIONS,
                },
            ],
        },
        {
            id: 'tv-shows',
            title: 'TV shows',
            icon: 'live_tv',
            links: [
                {
                    label: "What's on TV & streaming",
                    routerLink: '/watch/streaming',
                    description: 'Streaming guides, provider picks, and TV premieres.',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Airing today',
                    routerLink: '/tv/airing-today',
                    description: 'Shows with episodes airing today.',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Top TV shows',
                    routerLink: '/tv/top-rated',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Most popular TV shows',
                    routerLink: '/tv/popular',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'TV shows by genre',
                    routerLink: '/tv/genres',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
            ],
        },
        {
            id: 'watch',
            title: 'Watch',
            icon: 'play_circle',
            links: [
                {
                    label: 'Trending trailers',
                    routerLink: '/trailers/trending',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'New trailers',
                    routerLink: '/trailers/new',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
            ],
        },
        {
            id: 'people',
            title: 'People',
            icon: 'groups',
            links: [
                {
                    label: 'Popular people',
                    routerLink: '/discover',
                    queryParams: { type: 'person' },
                    activeOptions: DISCOVER_ACTIVE_OPTIONS,
                },
            ],
        },
        {
            id: 'explore',
            title: 'Explore',
            icon: 'travel_explore',
            links: [
                {
                    label: 'Advanced search',
                    routerLink: '/discover',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
            ],
        },
    ];

    menuOpen = false;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly cdr: ChangeDetectorRef,
    ) {}

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.closeMenu();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeMenu();
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
        this.cdr.markForCheck();
    }

    closeMenu(): void {
        if (!this.menuOpen) {
            return;
        }

        this.menuOpen = false;
        this.cdr.markForCheck();
    }
}
