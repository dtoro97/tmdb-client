import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Theme, ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcherComponent {
  isDark = true;

  constructor(private themeService: ThemeService) {}

  switchTheme(isDark: boolean): void {
    const theme = isDark ? Theme.DARK : Theme.LIGHT;
    this.themeService.switchTheme(theme);
    this.isDark = isDark;
  }
}
