import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';

import { PhotoState } from 'src/app/state/photo.store';
import { IPageInfo } from 'ngx-virtual-scroller';
import { ApiService } from 'src/app/services/api.service';
import { genPhotos, MockApiService, RESPONSE_PHOTO_COUNT } from 'src/app/state/photo.store.spec';
import { FetchPosts } from 'src/app/state/photo.actions';
import { ViewPhotosComponent } from './view-photos.component';

describe('ViewPostsComponent', () => {
  let fixture: ComponentFixture<ViewPhotosComponent>;
  let component: ViewPhotosComponent;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewPhotosComponent,
        MockComponent({
          selector: 'virtual-scroller',
          inputs: ['items', 'enableUnequalChildrenSizes'],
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
  });

  it('should create a component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

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

    expect(store.dispatch).toHaveBeenCalledWith(new FetchPosts());
  });

});
