import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';
import { Notification } from '../interfaces';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginatePipe } from '../../../pipes/paginate.pipe';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    TimeAgoPipe,
    NgClass,
    Skeleton,
    PaginationComponent,
    PaginatePipe,
    FormsModule,
    ToggleSwitch
  ],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotificationsComponent {
  notificationService = inject(NotificationService);
  rouer = inject(Router);
  private platformId = inject(PLATFORM_ID);
  notifications = this.notificationService.notificationsUser;
  isLoading = this.notificationService.isLoading;
  filteredNotifications = signal<Notification[]>([]);
  showOnlyMinHistoric = false;

  currentPage = 1;
  pageSize = 8;

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.filterNotifications();
      },
      error: (err) => {
        console.error('Error al cargar ofertas:', err);
      }
    });
  }

  filterNotifications() {
    if (this.showOnlyMinHistoric) {
      this.filteredNotifications.set(
        this.notifications().filter(notification =>
          this.isMinimumHistoric(notification.description)
        )
      );
    } else {
      this.filteredNotifications.set(this.notifications());
    }
    this.currentPage = 1; // Resetear a la primera página al aplicar filtro
  }

  isMinimumHistoric(message: string): boolean {
    return message.startsWith('¡MÍNIMO HISTÓRICO!');
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNotifications().length / this.pageSize);
  }

  onPageChange(page: number): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 10, behavior: 'smooth' });
    }
    this.currentPage = page;
  }

  readNotification(id: string, urlId: string) {
    this.notificationService.readNotification(id).subscribe({
      next: (res) => {
        this.rouer.navigate(['/seguimientos', urlId]);
      }
    });
  }

  getNotificationPriceUp(message: string): boolean {
    return message.includes('aumentó');
  }
}
