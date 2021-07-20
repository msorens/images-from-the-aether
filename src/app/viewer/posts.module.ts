import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { PostsRouting } from './post.routing';
import { ViewPhotosComponent } from './view-photos/view-photos.component';

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    PostsRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPhotosComponent],
  exports: [
    ViewPhotosComponent
  ],
})
export class PostsModule { }
