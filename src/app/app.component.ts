import { OnInit, AfterViewInit, Component, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { KeyService } from './services/key.service';
import { SetSearchString, TestApi } from './state/photo.actions';
import { PhotoState, ExecutionState } from './state/photo.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  private NON_BLANK = '.*[\\S].*';
  public DEBOUNCE_TIME = 400;
  public searchForm: FormGroup;
  public keyForm: FormGroup;
  private keyUp = new Subject<KeyboardEvent>();
  keyModalVisibility = new EventEmitter<boolean>();

  ExecutionState = ExecutionState; // This peculiar statement exposes the enum in the template.

  // Definite assignment assertion used here (the exclamation mark);
  // see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
  @Select(PhotoState.testStatus) testStatus$!: Observable<ExecutionState>;
  @Select(PhotoState.total) total$!: Observable<number>;
  @Select(PhotoState.fetchStatus) fetchStatus$!: Observable<ExecutionState>;

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
    this.keyForm = fb.group({
      key: ['', [Validators.required, Validators.pattern(this.NON_BLANK)]],
    });
  }

  ngOnInit(): void {
    this.keyUp
      .pipe(
        map((event) => (event.target as HTMLInputElement).value.trim()),
        filter((searchString) => !!searchString),
        debounceTime(this.DEBOUNCE_TIME),
        distinctUntilChanged()
      )
      .subscribe((searchString) =>
        this.store.dispatch(new SetSearchString(searchString))
      );
  }

  ngAfterViewInit(): void {
    const apiKey = this.keyStore.get();
    if (!apiKey) {
      this.setVisibility(true);
    }
  }

  handleKeyup(event: KeyboardEvent): void {
    // Convert event stream into Observable so we can hook into it and debounce.
    this.keyUp.next(event);
  }

  saveKey(key: string): void {
    this.keyStore.set(key);
    this.setVisibility(false);
  }

  testKey(key: string): void {
    this.store.dispatch(new TestApi(key));
  }

  setVisibility(state: boolean): void {
    this.keyModalVisibility.emit(state);
  }
}
