import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Store } from '@ngxs/store';
import { MockComponent } from 'ng2-mock-component';

import { PostState } from 'src/app/state/post.store';
import { IPageInfo } from 'ngx-virtual-scroller';
import { ApiService } from 'src/app/services/api.service';
import { genPhotos, MockApiService, RESPONSE_PHOTO_COUNT } from 'src/app/state/post.store.spec';
import { FetchPosts } from 'src/app/state/post.actions';
import { ViewPostsComponent } from './view-posts.component';

describe('ViewPostsComponent', () => {
  let fixture: ComponentFixture<ViewPostsComponent>;
  let component: ViewPostsComponent;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewPostsComponent,
        MockComponent({ selector: 'virtual-scroller' }),
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule,
        [NgxsModule.forRoot([PostState])],
      ],
      providers: [
        Store,
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(ViewPostsComponent);
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
