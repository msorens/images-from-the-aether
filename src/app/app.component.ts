import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'photo-gallery';

  constructor(private store: Store) {}

}
