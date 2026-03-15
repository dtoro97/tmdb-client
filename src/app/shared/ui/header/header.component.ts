import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';

interface NavItem {
    label: string;
    routerLink: string;
    queryParams?: Record<string, unknown>;
}

@Component({
    selector: 'app-header',
    imports: [
        MatButtonModule,
        MatIconModule,
        RouterLink,
        HeaderSearchBarComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent {
    menuOpen = false;

    @ViewChild('navbarEl') navbarEl!: ElementRef;

    movieItems: NavItem[] = [
        {
            label: 'Popular',
            routerLink: '/discover',
            queryParams: { category: 'popular', type: 'movie' },
        },
        {
            label: 'Now Playing',
            routerLink: '/discover',
            queryParams: { category: 'now_playing', type: 'movie' },
        },
        {
            label: 'Upcoming',
            routerLink: '/discover',
            queryParams: { category: 'upcoming', type: 'movie' },
        },
        {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: { category: 'top_rated', type: 'movie' },
        },
    ];

    tvItems: NavItem[] = [
        {
            label: 'Popular',
            routerLink: '/discover',
            queryParams: { category: 'popular', type: 'tv' },
        },
        {
            label: 'Airing Today',
            routerLink: '/discover',
            queryParams: { category: 'airing_today', type: 'tv' },
        },
        {
            label: 'On The Air',
            routerLink: '/discover',
            queryParams: { category: 'on_the_air', type: 'tv' },
        },
        {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: { category: 'top_rated', type: 'tv' },
        },
    ];

    personItem: NavItem = {
        label: 'Popular',
        routerLink: '/discover',
        queryParams: { category: 'popular', type: 'person' },
    };

    videoItem: NavItem = {
        label: 'What to watch',
        routerLink: '/trailers',
    };

    constructor(private cdr: ChangeDetectorRef) {}

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (
            this.navbarEl &&
            !this.navbarEl.nativeElement.contains(event.target)
        ) {
            this.menuOpen = false;
            this.cdr.markForCheck();
        }
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    onNavLinkClick() {
        this.menuOpen = false;
    }
}
