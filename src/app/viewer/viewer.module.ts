import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { ViewerRouting } from './viewer.routing';
import { ViewPhotosComponent } from './view-photos/view-photos.component';
import { ModalComponent } from './modal/modal.component';
import { Modal2Component } from './modal2/modal2.component';

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ViewerRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPhotosComponent, ModalComponent, Modal2Component],
  exports: [
    ViewPhotosComponent
  ],
})
export class ViewerModule { }
