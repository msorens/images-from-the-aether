import { NgModule, isDevMode } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { ViewerModule } from './viewer/viewer.module';
import { AppComponent } from './app.component';
import { PhotoState } from './state/photo.store';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatIconModule,
    MatProgressSpinnerModule,
    // ngxs development mode is stricter, guaranteeing immutability via deep-freeze-strict module.
    // See https://www.ngxs.io/advanced/options and https://www.npmjs.com/package/deep-freeze-strict
    // NB: immutability violations will show up only at runtime!
    NgxsModule.forRoot([PhotoState], {
      developmentMode: !environment.production,
    }),
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
