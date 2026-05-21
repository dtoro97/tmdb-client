import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    ViewChild,
} from '@angular/core';
import {
    IsActiveMatchOptions,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { HeaderAuthMenuComponent } from './header-auth-menu/header-auth-menu.component';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';
import { HeaderLocaleSelectorComponent } from './header-locale-selector/header-locale-selector.component';

interface NavLink {
    readonly label: string;
    readonly routerLink: string;
    readonly queryParams?: Record<string, string>;
    readonly activeOptions: IsActiveMatchOptions;
}

@Component({
    selector: 'app-header',
    imports: [
        MatIconModule,
        RouterLink,
        RouterLinkActive,
        HeaderAuthMenuComponent,
        HeaderSearchBarComponent,
        HeaderLocaleSelectorComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent {
    readonly navLinks: ReadonlyArray<NavLink> = [
        {
            label: 'Movies',
            routerLink: '/discover',
            queryParams: { type: 'movie' },
            activeOptions: {
                paths: 'exact',
                queryParams: 'subset',
                fragment: 'ignored',
                matrixParams: 'ignored',
            },
        },
        {
            label: 'TV shows',
            routerLink: '/discover',
            queryParams: { type: 'tv' },
            activeOptions: {
                paths: 'exact',
                queryParams: 'subset',
                fragment: 'ignored',
                matrixParams: 'ignored',
            },
        },
        {
            label: 'People',
            routerLink: '/discover',
            queryParams: { type: 'person' },
            activeOptions: {
                paths: 'exact',
                queryParams: 'subset',
                fragment: 'ignored',
                matrixParams: 'ignored',
            },
        },
        {
            label: 'Trailers',
            routerLink: '/trailers',
            activeOptions: {
                paths: 'exact',
                queryParams: 'ignored',
                fragment: 'ignored',
                matrixParams: 'ignored',
            },
        },
    ];

    menuOpen = false;

    @ViewChild('headerEl') headerEl!: ElementRef<HTMLElement>;

    constructor(private readonly cdr: ChangeDetectorRef) {}

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (
            this.headerEl &&
            !this.headerEl.nativeElement.contains(event.target as Node)
        ) {
            this.closeMenu();
        }
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
        this.cdr.markForCheck();
    }

    onNavLinkClick(): void {
        this.closeMenu();
    }

    closeMenu(): void {
        if (!this.menuOpen) {
            return;
        }

        this.menuOpen = false;
        this.cdr.markForCheck();
    }
}
