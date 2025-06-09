import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { ThemeService } from '../../../../services/theme.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Ripple } from 'primeng/ripple';
import { AsyncPipe } from '@angular/common';
import { Tooltip } from 'primeng/tooltip';
import { Popover } from 'primeng/popover';
import { PopoverModule } from 'primeng/popover';
import { RouterLink, RouterLinkActive } from '@angular/router';
import AuthService from '../../../auth/services/auth.service';
import { HideHeaderDirective } from '../../../../directives/hide-header.directive';

@Component({
  selector: 'app-header',
  imports: [
    Button,
    Ripple,
    AsyncPipe,
    Tooltip,
    Card,
    RouterLink,
    PopoverModule,
    HideHeaderDirective,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  authService = inject(AuthService);
  isDarkTheme$: Observable<boolean>;

  @ViewChild('op') op!: Popover;



  toggle(event: any) {
    this.op.toggle(event);
  }

  constructor(private themeService: ThemeService) {
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }


  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }
}
