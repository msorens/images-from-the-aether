import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';
import { BaseModalComponent } from './viewer/base-modal/base-modal.component';
import { SetSearchString } from './state/photo.actions';
import { PhotoState, STATE_NAME, TestState } from './state/photo.store';
import { IKeyService, KeyService } from './services/key.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  const keyServiceSpy: jasmine.SpyObj<IKeyService>
    = jasmine.createSpyObj('KeyService', ['get', 'set']);

  const config = {
    imports: [
      FormsModule,
      HttpClientModule,
      [NgxsModule.forRoot([PhotoState])],
      RouterTestingModule,
      ReactiveFormsModule
    ],
    declarations: [
      AppComponent,
      BaseModalComponent,
      MockComponent({ selector: 'app-view-photos' })
    ],
    providers: [
      Store,
      { provide: KeyService, useValue: keyServiceSpy }
    ],
  };

  describe('general', () => {
    beforeEach(() => {
      TestBed.configureTestingModule(config).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
    });

    it('should create the app', () => {
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it('should render heading', () => {
      fixture.detectChanges();
      expect(find('h1').textContent).toContain('Images');
    });
  });

  describe('API key', () => {
    let store: Store;

    beforeEach(() => {
      TestBed.configureTestingModule(config).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
      store = TestBed.inject(Store);
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

    it('modal has an input field to enter the key', () => {
      expect(find('#test-inputKey')).toBeTruthy();
    });

    it('modal has a button to save the key', () => {
      expect(find('#test-saveKey')).toBeTruthy();
    });

    it('modal has a button to test the key', () => {
      expect(find('#test-testKey')).toBeTruthy();
    });

    it('modal buttons are initially disabled', () => {
      fixture.detectChanges();
      expect(findAs<HTMLInputElement>('#test-inputKey').value).toBe('');

      ['#test-saveKey', '#test-testKey'].forEach(button => {
        expect(findAs<HTMLButtonElement>(button).disabled).toBeTrue();
      });
    });

    it('enabled state of modal buttons reacts to presence of input', () => {
      const inputElem = findAs<HTMLInputElement>('#test-inputKey');
      fixture.detectChanges();

      ['#test-saveKey', '#test-testKey'].forEach(button => {
        inputElem.value = '';
        fixture.detectChanges();
        expect(findAs<HTMLButtonElement>(button).disabled).toBeTrue();

        inputElem.value = 'any value';
        fixture.detectChanges();
        expect(findAs<HTMLButtonElement>(button).disabled).toBeFalse();

        inputElem.value = '         ';
        fixture.detectChanges();
        expect(findAs<HTMLButtonElement>(button).disabled).toBeTrue();
      });
    });

    it('test button has status indicators that are initially hidden', () => {
      expect(find('#button-label mat-icon')).toBeNull();
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('reveals only success indicator when API reports success', () => {
      setTestStatus(store, TestState.Success);
      expect(find('#button-label mat-icon').textContent).toBe('verified');
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('reveals only failure indicator when API reports failure', () => {
      setTestStatus(store, TestState.Failure);
      expect(find('#button-label mat-icon').textContent).toBe('error');
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('reveals only spinner when API operation is in progress', () => {
      setTestStatus(store, TestState.Loading);
      expect(find('#button-label mat-spinner')).toBeTruthy();
      expect(find('#button-label mat-icon')).toBeNull();
    });

  });

  describe('user input', () => {
    let store: Store;

    beforeEach(async () => {
      await TestBed.configureTestingModule(config).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
      store = TestBed.inject(Store);
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

    it('images are NOT fetched when input is empty', fakeAsync(
      (): void => {
        spyOn(store, 'dispatch');
        const searchString = '';
        setInputValue('#searchString', searchString);
        tick(component.DEBOUNCE_TIME);

        expect(store.dispatch).not.toHaveBeenCalled();
      }));

    [
      ['dog', 'no whitespace in user input used as is'],
      ['  dog', 'leading whitespace in user input ignored'],
      ['dog       ', 'trailing whitespace in user input ignored'],
      ['   dog ', 'leading and trailing whitespace in user input ignored']
    ].forEach(([searchString, description]) => {
      it(`${description}`, fakeAsync(
        (): void => {
          spyOn(store, 'dispatch');
          setInputValue('#searchString', searchString);

          tick(component.DEBOUNCE_TIME);

          expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString('dog'));
        }));
    });

  });

  function find(selector: string): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function findAs<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
  }

  function setInputValue(selector: string, value: string): void {
    fixture.detectChanges();
    const inputElem = findAs<HTMLInputElement>(selector);
    inputElem.value = value;
    inputElem.dispatchEvent(new KeyboardEvent('keyup'));
  }

  function setTestStatus(store: Store, status: TestState): void {
    // see https://www.ngxs.io/recipes/unit-testing#prepping-state
    const testStore = {};
    testStore[STATE_NAME] = store.snapshot()[STATE_NAME];
    testStore[STATE_NAME].testStatus = status;
    store.reset(testStore);
    fixture.detectChanges();
  }

});
