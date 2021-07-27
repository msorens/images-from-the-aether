import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable } from 'rxjs';

import { PhotoState } from 'src/app/state/photo.store';
import { ApiService } from 'src/app/services/api.service';
import { Photo } from 'src/app/models/Photo';
import { FetchPhotos } from 'src/app/state/photo.actions';
import { genPhotos, MockApiService, RESPONSE_PHOTO_COUNT } from 'src/app/state/photo.store.spec';
import { ViewPhotosComponent } from './view-photos.component';
import { ViewerModule } from '../viewer.module';

describe('ViewPhotosComponent', () => {
  let component: ViewPhotosComponent;
  let fixture: ComponentFixture<ViewPhotosComponent>;
  let element: HTMLElement;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewPhotosComponent,
        MockComponent({
          selector: 'virtual-scroller',
          inputs: ['items', 'enableUnequalChildrenSizes'],
        }),
        MockComponent({
          selector: 'app-modal2',
          inputs: ['openEvent'],
        }),
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule,
        [NgxsModule.forRoot([PhotoState])],
      ],
      providers: [Store, { provide: ApiService, useClass: MockApiService }],
    }).compileComponents();
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(ViewPhotosComponent);
    component = fixture.debugElement.componentInstance;
    element = fixture.nativeElement;
  });

  it('more photos are fetched when event is triggered by final photo', () => {
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);
    expect(component.photos.length).toBe(originalPhotoQty);

    component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
    fixture.detectChanges();

    expect(component.photos.length).toBe(originalPhotoQty + RESPONSE_PHOTO_COUNT);
  });

  it('more photos are NOT fetched while still loading previous batch', () => {
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);
    expect(component.photos.length).toBe(originalPhotoQty);
    component.loading = true;

    component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
    fixture.detectChanges();

    expect(component.photos.length).toBe(originalPhotoQty);
  });

  it('more photos are NOT fetched when event is triggered by any other photo', () => {
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);
    expect(component.photos.length).toBe(originalPhotoQty);

    component.fetchMore({ endIndex: 7 } as IPageInfo);
    fixture.detectChanges();

    expect(component.photos.length).toBe(originalPhotoQty);
  });

  it('more photos are NOT fetched when end of input reached', () => {
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);
    expect(component.photos.length).toBe(originalPhotoQty);
    component.endOfInputReached = true;

    component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
    fixture.detectChanges();

    expect(component.photos.length).toBe(originalPhotoQty);
  });

  it('more photos are NOT fetched when initializing event triggers', () => {
    component.photos = [];

    component.fetchMore({ endIndex: -1 } as IPageInfo);
    fixture.detectChanges();

    expect(component.photos.length).toBe(0);
  });

  it('dispatch is invoked when more photos available', () => {
    spyOn(store, 'dispatch');
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);

    component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(new FetchPhotos());
  });

  it('displays spinner while fetching photos', () => {
    const monitor = new LoadingMonitor();
    expect(monitor.events).toEqual([false]); // initialization

    store.dispatch(new FetchPhotos());

    // State of loading$ displays/hides the spinner.
    // Thus, toggling to true then back to false confirms the spinner shows appropriately.
    expect(monitor.events).toEqual([false, true, false]);
  });

  it('displays end marker when collection exhausted (logic)', () => {
    MockApiService.endOfInput = true;
    const monitor = new EndOfInputMonitor();
    expect(monitor.events).toEqual([false]); // initialization

    store.dispatch(new FetchPhotos());
    expect(monitor.events).toEqual([false, true]);
  });

  it('displays end marker when collection exhausted (rendering)', () => {
    MockApiService.endOfInput = true;
    const originalPhotoQty = 10;
    component.photos = genPhotos(1000, originalPhotoQty);
    expect(component.photos.length).toBe(originalPhotoQty);

    let endFlag = element.querySelector('#endFlag');
    expect(endFlag).toBeNull();

    component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
    fixture.detectChanges();

    endFlag = element.querySelector('#endFlag');
    expect(endFlag).not.toBeNull();
  });

  it('signals modal to open when user selects an image', () => {
    const photo: Photo = {
      src: {
        medium: 'some-medium-url'
      }
    } as Photo;
    let emitted = false;
    component.openUserModal.subscribe((event: string) => {
      emitted = true;
    });
    component.showDetail(photo);
    fixture.detectChanges();

    expect(emitted).toBeTrue();
  });

});

describe('ViewPhotosComponent without mocks', () => {
  let component: ViewPhotosComponent;
  let fixture: ComponentFixture<ViewPhotosComponent>;
  let element: HTMLElement;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewPhotosComponent
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule,
        ViewerModule,
        [NgxsModule.forRoot([PhotoState])],
      ],
      providers: [Store, { provide: ApiService, useClass: MockApiService }],
    }).compileComponents();
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(ViewPhotosComponent);
    component = fixture.debugElement.componentInstance;
    element = fixture.nativeElement;
  });

  it('renders larger image of selected photo in modal ', () => {
    const photo: Photo = {
      src: {
        large: 'some-large-url'
      }
    } as Photo;
    component.showDetail(photo);
    fixture.detectChanges();

    const imageElement: HTMLImageElement = element.querySelector('app-modal2 img');
    expect(imageElement.src.substring(imageElement.baseURI.length)).toBe(photo.src.large);
  });

  it('renders author of photo\'s name in modal ', () => {
    const photo: Photo = {
      src: {
        medium: 'some-medium-url'
      },
      photographer: 'bob smith'
    } as Photo;
    component.showDetail(photo);
    fixture.detectChanges();

    const nameElement: HTMLElement = element.querySelector('app-modal2 #author');
    expect(nameElement.textContent).toBe(photo.photographer);
  });

});

class LoadingMonitor {
  @Select(PhotoState.loading) loading$: Observable<boolean>;
  public events: boolean[] = [];

  constructor() {
    this.loading$.subscribe(flag => { this.events.push(flag); });
  }
}

class EndOfInputMonitor {
  @Select(PhotoState.endOfInputReached) endOfInputReached$: Observable<boolean>;
  public events: boolean[] = [];

  constructor() {
    this.endOfInputReached$.subscribe(flag => { this.events.push(flag); });
  }
}
