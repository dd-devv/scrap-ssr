import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [CardModule, RouterLink, RouterLinkActive],
  templateUrl: './about.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AboutComponent { }
