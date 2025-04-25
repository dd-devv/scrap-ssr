import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plans',
  imports: [
    RouterLink
  ],
  templateUrl: './plans.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlansComponent { }
