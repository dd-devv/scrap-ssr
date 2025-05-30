import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderComponent } from "../common/header/header.component";
import { FooterComponent } from "../common/footer/footer.component";
import { RouterOutlet } from '@angular/router';
import { SubscriptionService } from '../../user/services/subscription.service';
import AuthService from '../../auth/services/auth.service';
import { FeedbackComponent } from "../../shared/feedback/feedback.component";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, FooterComponent, RouterOutlet, FeedbackComponent],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  subscriptionService = inject(SubscriptionService);
  authService = inject(AuthService);

  constructor() {
    if (this.authService.isAuthenticatedUser()) {
      this.subscriptionService.getSubscriptionStatus().subscribe();
    }
  }
}
