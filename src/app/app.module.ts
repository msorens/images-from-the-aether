import { NgModule, isDevMode } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViewerModule } from './viewer/viewer.module';
import { PostState } from './state/post.store';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    NgxsModule.forRoot([PostState]),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: !isDevMode(), // disable for production builds
      maxAge: 25, // max number of entries
    }),
    ReactiveFormsModule,
    ViewerModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
