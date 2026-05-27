import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderAccountMenuComponent } from './header-account-menu/header-account-menu.component';
import { HeaderBrowseMenuComponent } from './header-browse-menu/header-browse-menu.component';
import { HeaderLocaleRegionMenuComponent } from './header-locale-region-menu/header-locale-region-menu.component';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';

@Component({
    selector: 'app-header',
    imports: [
        RouterLink,
        HeaderBrowseMenuComponent,
        HeaderAccountMenuComponent,
        HeaderSearchBarComponent,
        HeaderLocaleRegionMenuComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class HeaderComponent {}
