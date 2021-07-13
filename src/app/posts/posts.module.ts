import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PostsRouting } from './post.routing';
import { ViewPostsComponent } from './view-posts/view-posts.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

@NgModule({
  imports: [
    CommonModule,
    PostsRouting,
    VirtualScrollerModule
  ],
  declarations: [ViewPostsComponent],
  exports: [
    ViewPostsComponent
  ],
})
export class PostsModule { }
