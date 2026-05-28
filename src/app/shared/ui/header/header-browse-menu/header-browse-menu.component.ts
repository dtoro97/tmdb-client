import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

interface HeaderBrowseLink {
    readonly label: string;
    readonly routerLink: string;
    readonly activeOptions: IsActiveMatchOptions;
    readonly iconClass?: string;
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

@Component({
    selector: 'app-header-browse-menu',
    imports: [MatIconModule, RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header-browse-menu.component.html',
    styleUrl: './header-browse-menu.component.scss',
})
export class HeaderBrowseMenuComponent {
    readonly browseActions: readonly HeaderBrowseLink[] = [
        {
            label: 'Advanced filter',
            routerLink: '/discover',
            activeOptions: EXACT_ACTIVE_OPTIONS,
            iconClass: 'fa-solid fa-magnifying-glass',
        },
    ];

    readonly browseGroups: readonly HeaderBrowseGroup[] = [
        {
            id: 'movies',
            title: 'Movies',
            icon: 'movie',
            links: [
                {
                    label: 'Popular',
                    routerLink: '/movies/popular',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Top Rated',
                    routerLink: '/movies/top-rated',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Now Playing',
                    routerLink: '/movies/now-playing',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Upcoming',
                    routerLink: '/movies/upcoming',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
            ],
        },
        {
            id: 'tv-shows',
            title: 'TV shows',
            icon: 'live_tv',
            links: [
                {
                    label: 'Popular',
                    routerLink: '/tv/popular',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Top Rated',
                    routerLink: '/tv/top-rated',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Airing Today',
                    routerLink: '/tv/airing-today',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'On TV',
                    routerLink: '/tv/on-the-air',
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
                    label: 'Popular People',
                    routerLink: '/people/popular',
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
                    label: 'Streaming',
                    routerLink: '/watch/streaming',
                    activeOptions: EXACT_ACTIVE_OPTIONS,
                },
                {
                    label: 'Trailers',
                    routerLink: '/trailers/trending',
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

    @HostListener('window:scroll')
    onWindowScroll(): void {
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
