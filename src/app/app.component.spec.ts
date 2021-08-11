import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';
import { Modal2Component } from './viewer/modal2/modal2.component';
import { SetSearchString } from './state/photo.actions';
import { IKeyService, KeyService } from './services/key.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let element: HTMLElement;
  let store: Store;
  let keyServiceSpy: jasmine.SpyObj<IKeyService>;

  beforeEach(async () => {
    keyServiceSpy = jasmine.createSpyObj('KeyService', ['get', 'set']);
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        ReactiveFormsModule,
        [NgxsModule.forRoot([])],
      ],
      declarations: [
        AppComponent,
        Modal2Component,
        MockComponent({ selector: 'app-view-photos' })
      ],
      providers: [
        Store,
        { provide: KeyService, useValue: keyServiceSpy }
      ],
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

  it('pops up the key-entering modal when no key found stored', () => {
    let emitted = false;
    keyServiceSpy.get.and.returnValue('');
    component.keyModalVisibility.subscribe((setVisible: boolean) => {
      if (setVisible) {
        emitted = true;
      }
    });
    fixture.detectChanges();

    expect(emitted).toBeTrue();
  });

  it('does NOT pop up the key-entering modal when key is found stored', () => {
    let emitted = false;
    keyServiceSpy.get.and.returnValue('any');
    component.keyModalVisibility.subscribe((setVisible: boolean) => {
      emitted = true;
    });
    fixture.detectChanges();

    expect(emitted).toBeFalse();
  });

  it('stores the user-entered key in browser local storage', () => {
    findAs<HTMLInputElement>('#test-inputKey').value = 'some key';
    find('#test-saveKey').click();
    expect(keyServiceSpy.set).toHaveBeenCalledWith('some key');
  });

  it('at startup, retrieves the previously saved user-entered key from browser local storage', () => {
    fixture.detectChanges();
    expect(keyServiceSpy.get).toHaveBeenCalled();
  });

  it('should render heading', () => {
    fixture.detectChanges();
    expect(find('h1').textContent).toContain('Images');
  });

  it('images are fetched on every keystroke (after debounce period)', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = 'tiger';
      setInputValue('#searchString', searchString);
      tick(component.DEBOUNCE_TIME);

      expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString(searchString));
    }));

  it('images are NOT fetched if debounce period has not expired', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = 'any';
      setInputValue('#searchString', searchString);

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
        setInputValue('#searchString', searchString);

        tick(component.DEBOUNCE_TIME);

        expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString('dog'));
      }));
  });

  it('images are NOT fetched when input is empty', fakeAsync(
    (): void => {
      spyOn(store, 'dispatch');
      const searchString = '';
      setInputValue('#searchString', searchString);
      tick(component.DEBOUNCE_TIME);

      expect(store.dispatch).not.toHaveBeenCalled();
    }));

  function find(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function findAs<T>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function setInputValue(selector: string, value: string): void {
    const inputElem = findAs<HTMLInputElement>(selector);
    inputElem.value = value;
    inputElem.dispatchEvent(new KeyboardEvent('keyup'));
  }
});
