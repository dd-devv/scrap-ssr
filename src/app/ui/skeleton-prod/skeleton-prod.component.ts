import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'skeleton-prod',
  imports: [
    Skeleton,
    CardModule,
    ButtonModule
  ],
  templateUrl: './skeleton-prod.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonProdComponent { }
