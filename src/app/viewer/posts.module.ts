import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { PostsRouting } from './post.routing';
import { ViewPostsComponent } from './view-posts/view-posts.component';

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    PostsRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPostsComponent],
  exports: [
    ViewPostsComponent
  ],
})
export class PostsModule { }
