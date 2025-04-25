import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-faqs',
  imports: [
    AccordionModule,
    RouterLink
  ],
  templateUrl: './faqs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FaqsComponent { }
