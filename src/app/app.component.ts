import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { SetSearchString } from './state/photo.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  NON_BLANK = '.*[\\S].*';
  public searchForm: FormGroup;

  constructor(private store: Store, fb: FormBuilder) {
    this.searchForm = fb.group({
      searchString: [
        '',
        [Validators.required, Validators.pattern(this.NON_BLANK)],
      ],
    });
  }

  handleKeyup(): void {
    this.store.dispatch(new SetSearchString(this.searchForm.controls.searchString.value.trim()));
  }
}
