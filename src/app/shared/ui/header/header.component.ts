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

import { ConfigStoreService } from '../../services';
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
            queryParams: { sortBy: 'popularity.desc', page: 1, type: 'movie' },
        },
        {
            label: 'Now Playing',
            routerLink: '/discover',
            queryParams: {
                'primary_release_date.gte': this.getSpecificISODate(-30),
                'primary_release_date.lte': this.getSpecificISODate(+7),
                sortBy: 'popularity.desc',
                page: 1,
                type: 'movie',
            },
        },
        {
            label: 'Upcoming',
            routerLink: '/discover',
            queryParams: {
                'primary_release_date.gte': this.getSpecificISODate(-3),
                'primary_release_date.lte': this.getSpecificISODate(+7),
                sortBy: 'popularity.desc',
                page: 1,
                type: 'movie',
            },
        },
        {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: {
                sortBy: 'vote_average.desc',
                'vote_count.gte': 300,
                page: 1,
                type: 'movie',
            },
        },
    ];

    tvItems: NavItem[] = [
        {
            label: 'Popular',
            routerLink: '/discover',
            queryParams: { sortBy: 'popularity.desc', page: 1, type: 'tv' },
        },
        {
            label: 'Airing Today',
            routerLink: '/discover',
            queryParams: {
                'first_air_date.gte': this.getSpecificISODate(0),
                'first_air_date.lte': this.getSpecificISODate(0),
                sortBy: 'popularity.desc',
                page: 1,
                type: 'tv',
            },
        },
        {
            label: 'Top Rated',
            routerLink: '/discover',
            queryParams: {
                sortBy: 'vote_average.desc',
                'vote_count.gte': 300,
                page: 1,
                type: 'tv',
            },
        },
    ];

    constructor(
        private configStoreService: ConfigStoreService,
        private cdr: ChangeDetectorRef,
    ) {}

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

    private getSpecificISODate(daysToAdd: number): string {
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
    }
}
