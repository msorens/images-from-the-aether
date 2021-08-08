import { AfterViewInit, Component, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { KeyService } from './services/key.service';
import { SetSearchString } from './state/photo.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  private NON_BLANK = '.*[\\S].*';
  public DEBOUNCE_TIME = 400;
  public searchForm: FormGroup;
  private keyUp = new Subject<KeyboardEvent>();
  openUserModal = new EventEmitter();

  constructor(
    private store: Store,
    fb: FormBuilder,
    private keyStore: KeyService
  ) {
    this.searchForm = fb.group({
      searchString: [
        '',
        [Validators.required, Validators.pattern(this.NON_BLANK)],
      ],
    });
    this.keyUp
      .pipe(
        map(event => (event.target as HTMLInputElement).value.trim()),
        filter(searchString => !!searchString),
        debounceTime(this.DEBOUNCE_TIME),
        distinctUntilChanged(),
      )
      .subscribe(searchString =>
        this.store.dispatch(new SetSearchString(searchString))
      );
  }

  ngAfterViewInit(): void {
    const apiKey = this.keyStore.get();
    if (!apiKey) {
      this.openUserModal.emit();
    }
  }

  handleKeyup(event: KeyboardEvent): void {
    // Convert event stream into Observable so we can hook into it and debounce.
    this.keyUp.next(event);
  }

  saveKey(key: string): void {
    this.keyStore.set(key);
    // TODO: close modal, too!
  }
}
