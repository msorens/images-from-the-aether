import { ReactiveFormsModule } from '@angular/forms';
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

  it('images are refreshed on every keystroke', fakeAsync(
    (): void => {
      const searchString = 'tiger';
      const inputElem: HTMLInputElement = element.querySelector('#searchString');

      // This is ineffectual for updating the form element...
      //         inputElem.dispatchEvent(new Event('input'));
      // ...so update it directly:
      component.searchForm.controls.searchString.setValue(searchString);
      spyOn(store, 'dispatch');

      inputElem.dispatchEvent(new KeyboardEvent('keyup'));
      tick();
      fixture.detectChanges();

      expect(store.dispatch).toHaveBeenCalledWith(new SetSearchString(searchString));
    }));
});
