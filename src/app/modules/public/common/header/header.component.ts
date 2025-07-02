import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { ThemeService } from '../../../../services/theme.service';
import { Button, ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { Ripple } from 'primeng/ripple';
import { AsyncPipe } from '@angular/common';
import { Tooltip } from 'primeng/tooltip';
import { Popover } from 'primeng/popover';
import { PopoverModule } from 'primeng/popover';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import AuthService from '../../../auth/services/auth.service';
import { HideHeaderDirective } from '../../../../directives/hide-header.directive';
import { FormsModule } from '@angular/forms';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

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
    RouterLinkActive,
    FormsModule, InputGroup, InputGroupAddonModule, InputTextModule, ButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  authService = inject(AuthService);
  router = inject(Router);
  isDarkTheme$: Observable<boolean>;

  @ViewChild('op') op!: Popover;

  search = '';

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

  searchTerm() {
    this.router.navigate(['/search'], {
      queryParams: { q: this.search }
    });
    this.search = '';
  }
}
