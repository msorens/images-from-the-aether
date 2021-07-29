import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { SetSearchString } from './state/photo.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private NON_BLANK = '.*[\\S].*';
  public DEBOUNCE_TIME = 400;
  public searchForm: FormGroup;
  private keyUp = new Subject<KeyboardEvent>();

  constructor(private store: Store, fb: FormBuilder) {
    this.searchForm = fb.group({
      searchString: [
        '',
        [Validators.required, Validators.pattern(this.NON_BLANK)],
      ],
    });
    this.keyUp
      .pipe(
        map(event => (event.target as HTMLInputElement).value.trim()),
        debounceTime(this.DEBOUNCE_TIME),
        distinctUntilChanged(),
      )
      .subscribe(searchString =>
        this.store.dispatch(new SetSearchString(searchString))
      );
  }

  handleKeyup(event: KeyboardEvent): void {
    // Convert event stream into Observable so we can hook into it and debounce.
    this.keyUp.next(event);
  }
}
