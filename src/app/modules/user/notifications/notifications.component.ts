import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-notifications',
  imports: [TimeAgoPipe, NgClass, Skeleton],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotificationsComponent {
  notificationService = inject(NotificationService);
  rouer = inject(Router);

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe();
  }

  readNotification(id: string, urlId: string) {
    this.notificationService.readNotification(id).subscribe({
      next: (res) => {
        this.rouer.navigate(['/producto', urlId]);
      }
    });
  }

  getNotificationPriceUp(message: string): boolean {
    return message.includes('aumentó');
  }

}
