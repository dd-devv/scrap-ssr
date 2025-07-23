import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-views',
  imports: [],
  templateUrl: './views.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ViewsComponent { }
