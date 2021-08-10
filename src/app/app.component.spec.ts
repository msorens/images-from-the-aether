import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';
import { AppComponent } from './app.component';
import { SetSearchString } from './state/photo.actions';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let element: HTMLElement;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        ReactiveFormsModule,
        [NgxsModule.forRoot([])],
      ],
      declarations: [
        AppComponent,
        MockComponent({ selector: 'app-view-photos' })
      ],
      providers: [Store],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    store = TestBed.inject(Store);
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render heading', () => {
    fixture.detectChanges();
    expect(element.querySelector('h1').textContent).toContain('Images');
  });

  it('images are fetched on every keystroke (after debounce period)', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = 'tiger';

      const inputElem: HTMLInputElement = element.querySelector('#searchString');
      inputElem.value = searchString;
      inputElem.dispatchEvent(new KeyboardEvent('keyup'));
      tick(component.DEBOUNCE_TIME);

      expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString(searchString));
    }));

  it('images are NOT fetched if debounce period has not expired', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = 'tiger';

      const inputElem: HTMLInputElement = element.querySelector('#searchString');
      inputElem.value = searchString;
      inputElem.dispatchEvent(new KeyboardEvent('keyup'));

      tick(component.DEBOUNCE_TIME / 2);
      expect(store.dispatch).not.toHaveBeenCalled();

      tick(component.DEBOUNCE_TIME);
      expect(store.dispatch).toHaveBeenCalled();
    }));

  [
    [ 'dog', 'no whitespace in user input used as is' ],
    ['  dog', 'leading whitespace in user input ignored' ],
    ['dog       ', 'trailing whitespace in user input ignored' ],
    ['   dog ', 'leading and trailing whitespace in user input ignored' ]
  ].forEach(([searchString, description]) => {
    it(`${description}`, fakeAsync(
      (): void => {
        spyOn(store, 'dispatch');

        const inputElem: HTMLInputElement = element.querySelector('#searchString');
        inputElem.value = searchString;
        inputElem.dispatchEvent(new KeyboardEvent('keyup'));
        tick(component.DEBOUNCE_TIME);

        expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString('dog'));
      }));
  });

  it('images are NOT fetched when input is empty', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = '';

      const inputElem: HTMLInputElement = element.querySelector('#searchString');
      inputElem.value = searchString;
      inputElem.dispatchEvent(new KeyboardEvent('keyup'));
      tick(component.DEBOUNCE_TIME);

      expect(store.dispatch).not.toHaveBeenCalled();
    }));


});
