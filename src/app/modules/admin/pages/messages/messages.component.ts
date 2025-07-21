import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MessagesComponent { }
