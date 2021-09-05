import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { ViewerRouting } from './viewer.routing';
import { ViewPhotosComponent } from './view-photos/view-photos.component';
import { BaseModalComponent } from './base-modal/base-modal.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ViewerRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPhotosComponent, BaseModalComponent],
  exports: [
    ViewPhotosComponent,
    BaseModalComponent
  ],
})
export class ViewerModule { }
