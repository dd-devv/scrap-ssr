import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users',
  imports: [],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersComponent { }
