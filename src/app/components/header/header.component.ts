import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: false,

  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isDarkMode = true;
  items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'fa-solid fa-house',
    },
    {
      label: 'Movies',
      icon: 'fa-solid fa-clapperboard',
    },
    {
      label: 'TV Shows',
      icon: 'fa-solid fa-tv',
    },
    {
      label: 'People',
      icon: 'fa-solid fa-user',
    },
  ];

  toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('dark');
    this.isDarkMode = !this.isDarkMode;
  }
}
