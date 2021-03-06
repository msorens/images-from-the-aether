import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
import { MockComponent } from 'ng2-mock-component';

import { cssSelector, find, findAllAs, findAs, findOneAs, setFixture } from './utility/queryHelper';
import { setStoreSnapshot } from './utility/storeHelper';
import { genResponse } from './state/photo.store.spec';
import { BaseModalComponent } from './viewer/base-modal/base-modal.component';
import { FetchPhotos, SetSearchString } from './state/photo.actions';
import { PhotoState, ExecutionState } from './state/photo.store';
import { IKeyService, KeyService } from './services/key.service';
import { generateErrorResponse, IImageService, ImageService } from './services/image.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  const keyServiceSpy: jasmine.SpyObj<IKeyService>
    = jasmine.createSpyObj('KeyService', ['get', 'set']);

  const baseConfig = {
    imports: [
      FormsModule,
      HttpClientModule,
      MatIconModule,
      MatProgressSpinnerModule,
      [NgxsModule.forRoot([PhotoState])],
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

  describe('display', () => {
    let store: Store;
    let imageServiceSpy: jasmine.SpyObj<IImageService>;

    beforeEach(() => {
      imageServiceSpy = jasmine.createSpyObj('ImageService', ['loadPage']);
      const config = {
        ...baseConfig,
        providers: [...baseConfig.providers, { provide: ImageService, useValue: imageServiceSpy }]
      };
      TestBed.configureTestingModule(config).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      setFixture(fixture);
      component = fixture.componentInstance;
      store = TestBed.inject(Store);
    });

    it('should create the app', () => {
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it('shows the application name', () => {
      fixture.detectChanges();
      expect(find('h1')?.textContent).toContain('Images from the Aether');
    });

    it('shows a search box', () => {
      expect(find('#searchString')).toBeTruthy();
    });

    describe('reporting of total available images (DEPTH COVERAGE)', () => {

      it('shows no total matches BEFORE a search', () => {
        expect(find('#total')).toBeFalsy();
      });

      it('shows no total matches while loading', () => {
        setStoreSnapshot(store, model => model.fetchStatus = ExecutionState.Loading);
        fixture.detectChanges();

        expect(find('#total')).toBeFalsy();
      });

      it('shows total available NON-ZERO Matches AFTER a search', () => {
        imageServiceSpy.loadPage.and
          .returnValue(of(genResponse({ includePhotos: true })));
        store.dispatch(new FetchPhotos());
        fixture.detectChanges();
        expect(find('#total')?.parentElement?.textContent).toContain('Total:');
        expect(find('#total')?.textContent).toBe('101');
      });

      it('shows total available ZERO Matches AFTER a search', () => {
        imageServiceSpy.loadPage.and
          .returnValue(of(genResponse({ includePhotos: false })));
        store.dispatch(new FetchPhotos());
        fixture.detectChanges();
        expect(find('#total')?.parentElement?.textContent).toContain('Total:');
        expect(find('#total')?.textContent).toBe('0');
      });

      it('shows total with zero matches on HTTP error', () => {
        imageServiceSpy.loadPage.and
          .returnValue(throwError(
            generateErrorResponse(StatusCodes.FORBIDDEN, 'unauthorized')
          ));
        store.dispatch(new FetchPhotos());
        fixture.detectChanges();
        expect(find('#total')?.parentElement?.textContent).toContain('Total:');
        expect(find('#total')?.textContent).toBe('0');
      });
   });
  });

  describe('API key', () => {
    beforeEach(() => {
      TestBed.configureTestingModule(baseConfig).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      setFixture(fixture);
      component = fixture.componentInstance;
    });

    describe('key-entering modal opening (DEPTH COVERAGE)', () => {

      it('opens automatically when NO key found stored', () => {
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

      it('does NOT open automatically when key is found stored', () => {
        let emitted = false;
        keyServiceSpy.get.and.returnValue('any non-empty');
        component.keyModalVisibility.subscribe((setVisible: boolean) => {
          emitted = true;
        });
        fixture.detectChanges();

        expect(emitted).toBeFalse();
      });
    });

    describe('button to re-open key modal', () => {

      it('renders on main window', () => {
        expect(find('.apikey')).toBeTruthy();
      });

      it('has label with key icon from material icons', () => {
        expect(find('.apikey mat-icon')).toBeTruthy();
        expect(find('.apikey mat-icon')?.textContent).toBe('vpn_key');
      });

      it('includes tooltip', () => {
        expect(find('.apikey')?.title).toBe('Set or test API key');
      });

      it('opens the key-entering modal manually when clicked', () => {
        let emitted = false;
        keyServiceSpy.get.and.returnValue('any non-empty');
        component.keyModalVisibility.subscribe((setVisible: boolean) => {
          if (setVisible) {
            emitted = true;
          }
        });
        fixture.detectChanges();
        expect(emitted).toBeFalse(); // baseline; not open yet

        find('.apikey')?.click();
        expect(emitted).toBeTrue();
      });
    });

    it('stores the user-entered key in browser local storage', () => {
      findAs<HTMLInputElement>('.modal-control-bar input').value = 'some key';
      const saveButton = findOneAs<HTMLButtonElement>('.modal-control-bar button', 'Save');
      expect(saveButton).toBeTruthy();

      saveButton?.click();

      expect(keyServiceSpy.set).toHaveBeenCalledWith('some key');
    });

    it('at startup, retrieves the previously saved user-entered key from browser local storage', () => {
      fixture.detectChanges();
      expect(keyServiceSpy.get).toHaveBeenCalled();
    });
  });

  describe('key modal', () => {
    let store: Store;

    beforeEach(() => {
      TestBed.configureTestingModule(baseConfig).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      setFixture(fixture);
      component = fixture.componentInstance;
      store = TestBed.inject(Store);
    });

    it('has an input field to enter the key', () => {
      expect(find('.modal-control-bar input')).toBeTruthy();
    });

    it('has buttons to save and to test the key', () => {
      const buttons = findAllAs<HTMLButtonElement>('.modal-control-bar button');
      expect(buttons.length).toBe(2);

      ['Save', 'Test'].forEach(label => {
        expect(findOneAs<HTMLButtonElement>(buttons, label))
          .not.toBeNull(`no button with text "${label}" found`);
      });
    });

    it('buttons are initially disabled', () => {
      fixture.detectChanges();
      expect(findAs<HTMLInputElement>('.modal-control-bar input').value).toBe('');

      findAllAs<HTMLButtonElement>('.modal-control-bar button')
        .forEach(button => {
          expect(button.disabled).toBeTrue();
        });
    });

    it('buttons reacts to presence of input', () => {
      const inputElem = findAs<HTMLInputElement>('.modal-control-bar input');
      fixture.detectChanges();

      findAllAs<HTMLButtonElement>('.modal-control-bar button')
        .forEach(button => {
          inputElem.value = '';
          fixture.detectChanges();
          expect(button.disabled).toBeTrue();

          inputElem.value = 'any value';
          fixture.detectChanges();
          expect(button.disabled).toBeFalse();

          inputElem.value = '         ';
          fixture.detectChanges();
          expect(button.disabled).toBeTrue();
        });
    });

    it('test button has status indicators that are initially hidden', () => {
      expect(find('#button-label mat-icon')).toBeNull();
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('test button reveals only success indicator when API reports success', () => {
      setTestStatus(store, ExecutionState.Success);
      expect(find('#button-label mat-icon')?.textContent).toBe('verified');
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('test button reveals only failure indicator when API reports failure', () => {
      setTestStatus(store, ExecutionState.Failure);
      expect(find('#button-label mat-icon')?.textContent).toBe('error');
      expect(find('#button-label mat-spinner')).toBeNull();
    });

    it('test button reveals only spinner when API operation is in progress', () => {
      setTestStatus(store, ExecutionState.Loading);
      expect(find('#button-label mat-spinner')).toBeTruthy();
      expect(find('#button-label mat-icon')).toBeNull();
    });

    it('test button is disabled while test operation is in progress', () => {
      findAs<HTMLInputElement>('.modal-control-bar input').value = 'some string';
      setTestStatus(store, ExecutionState.Loading);
      expect(findOneAs<HTMLButtonElement>('.modal-control-bar button', 'Test')?.disabled).toBeTrue();
    });

    it('test button is NOT disabled when test operation completes', () => {
      setTestStatus(store, ExecutionState.Success);
      setInputValue('.modal-control-bar input', 'some string');
      fixture.detectChanges();
      expect(findOneAs<HTMLButtonElement>('.modal-control-bar button', 'Test')?.disabled).toBeFalse();
    });

  });

  describe('user input', () => {
    let store: Store;

    beforeEach(async () => {
      await TestBed.configureTestingModule(baseConfig).compileComponents();
      fixture = TestBed.createComponent(AppComponent);
      setFixture(fixture);
      component = fixture.componentInstance;
      store = TestBed.inject(Store);
    });

    describe('react to keystrokes', () => {

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
    });

    describe('normalizing input (DEPTH COVERAGE)', () => {
      [
        ['dog', 'user input used verbatim when no whitespace present'],
        ['dog cat', 'intermediate whitespace in user input is preserved'],
        ['  dog', 'leading whitespace in user input ignored'],
        ['dog       ', 'trailing whitespace in user input ignored'],
        ['   dog ', 'leading and trailing whitespace in user input ignored'],
        ['dog! + (cat)', 'special characters used verbatim'],
      ].forEach(([searchString, description]) => {
        it(`${description}`, fakeAsync(
          (): void => {
            spyOn(store, 'dispatch');
            setInputValue('#searchString', searchString);

            tick(component.DEBOUNCE_TIME);

            expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString(searchString.trim()));
          }));
      });
    });

  });

  function setInputValue(selector: cssSelector, value: string): void {
    fixture.detectChanges();
    const inputElem = findAs<HTMLInputElement>(selector);
    inputElem.value = value;
    inputElem.dispatchEvent(new KeyboardEvent('keyup'));
  }

  function setTestStatus(store: Store, status: ExecutionState): void {
    setStoreSnapshot(store, model => model.testStatus = status);
    fixture.detectChanges();
  }

});
