import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CountState } from './app.state';
import { ViewPostsComponent } from './posts/view-posts/view-posts.component';
import { PostState } from './state/post.store';

@NgModule({
  declarations: [AppComponent, ViewPostsComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    NgxsModule.forRoot([CountState, PostState ]),
    VirtualScrollerModule,
    NoopAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
