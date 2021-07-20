import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { ViewerRouting } from './viewer.routing';
import { ViewPhotosComponent } from './view-photos/view-photos.component';

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ViewerRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPhotosComponent],
  exports: [
    ViewPhotosComponent
  ],
})
export class ViewerModule { }
