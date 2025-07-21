import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarComponent } from "../common/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-admin',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './layout-admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutAdminComponent { }
