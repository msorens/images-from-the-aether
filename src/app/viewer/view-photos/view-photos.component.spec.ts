import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable, of } from 'rxjs';

import { PhotoState } from 'src/app/state/photo.store';
import { IImageService, ImageService } from 'src/app/services/image.service';
import { Photo } from 'src/app/models/Photo';
import { FetchPhotos, SetSearchString } from 'src/app/state/photo.actions';
import { genPhotos, genResponse, MockImageService, RESPONSE_PHOTO_COUNT } from 'src/app/state/photo.store.spec';
import { ViewerModule } from 'src/app/viewer/viewer.module';
import { ViewPhotosComponent } from './view-photos.component';

describe('ViewPhotosComponent', () => {
  let component: ViewPhotosComponent;
  let fixture: ComponentFixture<ViewPhotosComponent>;
  let store: Store;

  const baseConfig = {
    declarations: [ViewPhotosComponent],
    imports: [
      RouterTestingModule,
      HttpClientModule,
      [NgxsModule.forRoot([PhotoState])],
    ],
    providers: [Store],
    schemas: [NO_ERRORS_SCHEMA]
  };

  describe('default', () => {

    beforeEach(() => {
      const config = { ...baseConfig };
      TestBed.configureTestingModule(config).compileComponents();
      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      component = fixture.debugElement.componentInstance;
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

    it('signals modal to open when user selects an image', () => {
      const photo: Photo = {
        src: {
          medium: 'some-medium-url'
        }
      } as Photo;
      let emitted = false;
      component.detailModalVisibility.subscribe((event: string) => {
        emitted = true;
      });
      component.showDetail(photo);
      fixture.detectChanges();

      expect(emitted).toBeTrue();
    });

  });

  describe('with mock API', () => {

    beforeEach(() => {
      const config = {
        ...baseConfig,
        providers: [...baseConfig.providers, { provide: ImageService, useClass: MockImageService }]
      };
      TestBed.configureTestingModule(config).compileComponents();
      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      component = fixture.debugElement.componentInstance;
    });

    it('displays end marker when collection exhausted (logic)', () => {
      MockImageService.endOfInput = true;
      const monitor = new EndOfInputMonitor();
      expect(monitor.events).toEqual([false]); // initialization

      store.dispatch(new FetchPhotos());
      expect(monitor.events).toEqual([false, true]);
    });

    it('displays spinner while fetching photos', () => {
      const monitor = new LoadingMonitor();
      expect(monitor.events).toEqual([false]); // initialization

      store.dispatch(new FetchPhotos());

      // State of loading$ displays/hides the spinner.
      // Thus, toggling to true then back to false confirms the spinner shows appropriately.
      expect(monitor.events).toEqual([false, true, false]);
    });

    it('displays end marker when collection exhausted (rendering)', () => {
      MockImageService.endOfInput = true;
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);

      expect(find('#endFlag')).toBeNull();

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(find('#endFlag')).not.toBeNull();
    });

    it('more photos are fetched when event is triggered by final photo', () => {
      const originalPhotoQty = 10;
      component.photos = genPhotos(1000, originalPhotoQty);
      expect(component.photos.length).toBe(originalPhotoQty);

      component.fetchMore({ endIndex: originalPhotoQty - 1 } as IPageInfo);
      fixture.detectChanges();

      expect(component.photos.length).toBe(originalPhotoQty + RESPONSE_PHOTO_COUNT);
    });

  });

  describe('with spy API', () => {

    beforeEach(() => {
      const imageServiceSpy: jasmine.SpyObj<IImageService>
        = jasmine.createSpyObj('ImageService', ['loadPage']);
      imageServiceSpy.loadPage.and.returnValue(
        of(genResponse({ includePhotos: false })));
      const config = {
        ...baseConfig,
        providers: [...baseConfig.providers, { provide: ImageService, useValue: imageServiceSpy }]
      };
      TestBed.configureTestingModule(config).compileComponents();

      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      component = fixture.debugElement.componentInstance;
    });

    it('displays no-search-started-graphic with no input', () => {
      fixture.detectChanges();
      expect(find('#noSearchPerformed')).not.toBeNull();
      expect(find('#noResultsFound')).toBeNull();
    });

    it('displays no-results-graphic with some input but no results', () => {
      store.dispatch(new SetSearchString('any'));
      fixture.detectChanges();
      expect(find('#noSearchPerformed')).toBeNull();
      expect(find('#noResultsFound')).not.toBeNull();
    });

    it('does not display either empty graphic while loading', () => {
      fixture.detectChanges();
      component.loading = true;
      fixture.detectChanges();

      expect(find('#noSearchPerformed')).toBeNull();
      expect(find('#noResultsFound')).toBeNull();

      store.dispatch(new SetSearchString('any'));
      fixture.detectChanges();
      component.loading = true;
      fixture.detectChanges();

      expect(find('#noSearchPerformed')).toBeNull();
      expect(find('#noResultsFound')).toBeNull();
      fixture.detectChanges();
      component.loading = true;
      fixture.detectChanges();

      expect(find('#noSearchPerformed')).toBeNull();
      expect(find('#noResultsFound')).toBeNull();
    });

  });

  describe('with modal component', () => {

    beforeEach(() => {

      const config = {
        ...baseConfig,
        imports: [...baseConfig.imports, ViewerModule],
        schemas: []
      };
      TestBed.configureTestingModule(config).compileComponents();

      store = TestBed.inject(Store);
      fixture = TestBed.createComponent(ViewPhotosComponent);
      component = fixture.debugElement.componentInstance;
    });

    it('renders larger image of selected photo in modal', () => {
      const photo: Photo = {
        src: {
          large: 'some-large-url'
        }
      } as Photo;
      component.showDetail(photo);
      fixture.detectChanges();

      const imageElement = findAs<HTMLImageElement>('app-base-modal img');
      expect(imageElement.src.substring(imageElement.baseURI.length)).toBe(photo.src.large);
    });

    it('renders author of photo\'s name in modal', () => {
      const photo: Photo = {
        src: {
          medium: 'some-medium-url'
        },
        photographer: 'bob smith'
      } as Photo;
      component.showDetail(photo);
      fixture.detectChanges();

      expect(find('app-base-modal #author').textContent).toBe(photo.photographer);
    });

    it('renders link to author enclosing the name', () => {
      const photo: Photo = {
        src: {
          medium: 'some-medium-url'
        },
        photographer: 'bob smith',
        photographer_url: 'http://www.any.com/'
      } as Photo;
      component.showDetail(photo);
      fixture.detectChanges();

      const anchorElement = findParentAs<HTMLAnchorElement>('app-base-modal #author');
      expect(anchorElement.href).toBe(photo.photographer_url);
    });

  });

  function find(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function findAs<T>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function findParentAs<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector).parentElement as T;
  }

});

class LoadingMonitor {
  @Select(PhotoState.loading) loading$!: Observable<boolean>;
  public events: boolean[] = [];

  constructor() {
    this.loading$.subscribe(flag => { this.events.push(flag); });
  }
}

class EndOfInputMonitor {
  @Select(PhotoState.endOfInputReached) endOfInputReached$!: Observable<boolean>;
  public events: boolean[] = [];

  constructor() {
    this.endOfInputReached$.subscribe(flag => { this.events.push(flag); });
  }
}
