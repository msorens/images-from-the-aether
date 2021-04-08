import { Component } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Add, CountState } from './app.state';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'photo-gallery';

  @Select(CountState.myCount) count$: Observable<number>;

  constructor(private store: Store) {}

  onClick(): void {
    this.store.dispatch(new Add());
  }
}
